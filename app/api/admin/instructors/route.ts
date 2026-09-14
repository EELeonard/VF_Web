import { env } from "cloudflare:workers";
import { isValidSession } from "../../../lib/admin-auth";
import { SIMULATOR_NAMES } from "../../../lib/availability-db";
import { ensureInstructorDatabase, type Instructor, type InstructorDayAssignment } from "../../../lib/instructors-db";
import { hashPassword } from "../../../lib/admin-db";
import { sendUserInvitation } from "../../../lib/user-invitations";

const validEmail = (value:string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function GET(request:Request) {
  if (!(await isValidSession(request, env.DB))) return Response.json({error:"Nicht autorisiert."},{status:401});
  const db = await ensureInstructorDatabase(env.DB);
  const [instructors, assignments, capabilities, availability, availabilityRanges] = await Promise.all([
    db.prepare("SELECT * FROM instructors ORDER BY active DESC, name").all<Instructor>(),
    db.prepare("SELECT a.*, i.name AS instructor_name FROM instructor_day_assignments a JOIN instructors i ON i.id = a.instructor_id ORDER BY a.flight_date, a.simulator").all<InstructorDayAssignment>(),
    db.prepare("SELECT instructor_id,simulator FROM instructor_capabilities").all<{instructor_id:number;simulator:string}>(),
    db.prepare("SELECT instructor_id,available_date,available_time FROM instructor_availability WHERE available_date >= date('now') ORDER BY available_date,available_time").all<{instructor_id:number;available_date:string;available_time:string}>(),
    db.prepare("SELECT instructor_id,available_date,available_from,available_until FROM instructor_availability_ranges WHERE available_date >= date('now') ORDER BY available_date").all<{instructor_id:number;available_date:string;available_from:string;available_until:string}>(),
  ]);
  return Response.json({instructors:instructors.results.map(item=>({...item,capabilities:capabilities.results.filter(capability=>capability.instructor_id===item.id).map(capability=>capability.simulator),availability:availability.results.filter(slot=>slot.instructor_id===item.id),availabilityRanges:availabilityRanges.results.filter(range=>range.instructor_id===item.id)})), assignments:assignments.results});
}

export async function POST(request:Request) {
  if (!(await isValidSession(request, env.DB))) return Response.json({error:"Nicht autorisiert."},{status:401});
  const body = await request.json() as Record<string,unknown>; const action=String(body.action??"");
  const db = await ensureInstructorDatabase(env.DB);
  if (action === "create") {
    const name=String(body.name??"").trim(), email=String(body.email??"").trim().toLowerCase(),username=String(body.username??"").trim(),password=String(body.password??"");
    if (!name || name.length>100 || !validEmail(email) || !/^[a-zA-Z0-9._-]{3,40}$/.test(username) || password.length<12) return Response.json({error:"Name, E-Mail, Benutzername oder Passwort ist ungültig."},{status:400});
    if(username.toLowerCase()===(process.env.ADMIN_USER??"admin").toLowerCase()||await db.prepare("SELECT id FROM admin_users WHERE lower(username)=lower(?) UNION ALL SELECT id FROM instructors WHERE lower(username)=lower(?)").bind(username,username).first())return Response.json({error:"Dieser Benutzername ist bereits vergeben."},{status:409});
    try { const credentials=await hashPassword(password),result=await db.prepare("INSERT INTO instructors (name,email,username,password_hash,password_salt) VALUES (?,?,?,?,?)").bind(name,email,username,credentials.hash,credentials.salt).run();const invitation=await sendUserInvitation(db,request.url,{username,displayName:name,email},env);return Response.json({created:true,id:result.meta.last_row_id,invitation},{status:201}); }
    catch { return Response.json({error:"Diese E-Mail-Adresse ist bereits einem Instructor zugeordnet."},{status:409}); }
  }
  if (action === "schedule") {
    const instructorId=Number(body.instructorId), simulator=String(body.simulator??""), date=String(body.date??"");
    if (!Number.isInteger(instructorId) || !SIMULATOR_NAMES.includes(simulator as typeof SIMULATOR_NAMES[number]) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return Response.json({error:"Ungültige Tageszuordnung."},{status:400});
    if (!(await db.prepare("SELECT id FROM instructors i WHERE id=? AND active=1 AND EXISTS (SELECT 1 FROM instructor_capabilities c WHERE c.instructor_id=i.id AND c.simulator=?)").bind(instructorId,simulator).first())) return Response.json({error:"Instructor ist für diesen Simulator nicht freigeschaltet."},{status:400});
    const required=await db.prepare("SELECT id,flight_time,duration,flight_start_at FROM bookings WHERE simulator=? AND flight_date=? AND status!='cancelled'").bind(simulator,date).all<{id:number;flight_time:string;duration:number;flight_start_at:string|null}>();
    const range=await db.prepare("SELECT available_from,available_until FROM instructor_availability_ranges WHERE instructor_id=? AND available_date=?").bind(instructorId,date).first<{available_from:string;available_until:string}>();
    const minutes=(value:string)=>{const [hours,mins]=value.split(":").map(Number);return hours*60+mins;};
    if(!range)return Response.json({error:"Für diesen Tag ist kein Verfügbarkeitsfenster des Instructors hinterlegt."},{status:409});
    const eligible=required.results.filter(item=>minutes(item.flight_time)>=minutes(range.available_from)&&minutes(item.flight_time)+item.duration<=minutes(range.available_until)+1);
    for(const booking of eligible){const conflict=await db.prepare("SELECT existing.reference FROM bookings existing WHERE existing.instructor_id=? AND existing.id!=? AND existing.flight_date=? AND existing.simulator!=? AND existing.status!='cancelled' AND ((? IS NOT NULL AND existing.flight_start_at IS NOT NULL AND datetime(existing.flight_start_at)<datetime(?,'+'||?||' minutes') AND datetime(existing.flight_start_at,'+'||existing.duration||' minutes')>datetime(?)) OR (? IS NULL AND existing.flight_time=?)) LIMIT 1").bind(instructorId,booking.id,date,simulator,booking.flight_start_at,booking.flight_start_at,booking.duration,booking.flight_start_at,booking.flight_start_at,booking.flight_time).first<{reference:string}>();if(conflict)return Response.json({error:`Der Instructor ist zu dieser Zeit bereits für ${conflict.reference} eingeplant.`},{status:409});}
    await db.batch([
      db.prepare("INSERT INTO instructor_day_assignments (instructor_id,simulator,flight_date) VALUES (?,?,?) ON CONFLICT(simulator,flight_date) DO UPDATE SET instructor_id=excluded.instructor_id").bind(instructorId,simulator,date),
      db.prepare("UPDATE bookings SET instructor_id=NULL,instructor_assignment_source=NULL WHERE simulator=? AND flight_date=? AND instructor_assignment_source='day'").bind(simulator,date),
      ...eligible.map(booking=>db.prepare("UPDATE bookings SET instructor_id=?,instructor_assignment_source='day' WHERE id=? AND (instructor_id IS NULL OR instructor_assignment_source='day')").bind(instructorId,booking.id)),
    ]);
    return Response.json({scheduled:true,assignedCount:eligible.length,availableFrom:range.available_from,availableUntil:range.available_until});
  }
  if (action === "notify-day") {
    const instructorId=Number(body.instructorId), date=String(body.date??"");
    if(!Number.isInteger(instructorId)||!/^\d{4}-\d{2}-\d{2}$/.test(date))return Response.json({error:"Ungültige Benachrichtigung."},{status:400});
    const instructor=await db.prepare("SELECT id,name,email FROM instructors WHERE id=? AND active=1").bind(instructorId).first<{id:number;name:string;email:string}>();
    if(!instructor)return Response.json({error:"Instructor ist nicht aktiv."},{status:400});
    const bookings=await db.prepare("SELECT reference,simulator,flight_time,duration,customer_name FROM bookings WHERE instructor_id=? AND flight_date=? AND status!='cancelled' ORDER BY flight_time").bind(instructorId,date).all<{reference:string;simulator:string;flight_time:string;duration:number;customer_name:string}>();
    if(!bookings.results.length)return Response.json({error:"Für diesen Instructor gibt es an diesem Tag keine Termine."},{status:400});
    const apiKey=env.RESEND_API_KEY?.trim(),from=(env.ADMIN_EMAIL_FROM??env.BOOKING_EMAIL_FROM)?.trim();if(!apiKey||!from)return Response.json({error:"Der E-Mail-Dienst ist nicht vollständig konfiguriert."},{status:502});
    const lines=bookings.results.map(item=>`${item.flight_time} | ${item.simulator} | ${item.duration} Minuten | ${item.customer_name} | ${item.reference}`),text=`Hallo ${instructor.name},\n\nIhr Vienna Flight Tagesplan für ${date}:\n\n${lines.join("\n")}\n\nVienna Flight`;
    const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{authorization:`Bearer ${apiKey}`,"content-type":"application/json"},body:JSON.stringify({from,to:[instructor.email],subject:`Ihr Vienna Flight Tagesplan für ${date}`,text})});if(!response.ok)return Response.json({error:"Der Tagesplan konnte nicht zugestellt werden."},{status:502});return Response.json({sent:true,count:bookings.results.length});
  }
  return Response.json({error:"Unbekannte Aktion."},{status:400});
}

export async function PATCH(request:Request) {
  if (!(await isValidSession(request, env.DB))) return Response.json({error:"Nicht autorisiert."},{status:401});
  const body=await request.json() as Record<string,unknown>; const id=Number(body.id), active=body.active===true;
  if (!Number.isInteger(id)) return Response.json({error:"Ungültiger Instructor."},{status:400});
  const db=await ensureInstructorDatabase(env.DB);
  if(body.action==="capabilities"){
    const requested=Array.isArray(body.capabilities)?body.capabilities.map(String):[];
    const capabilities=[...new Set(requested.filter(value=>SIMULATOR_NAMES.includes(value as typeof SIMULATOR_NAMES[number])))];
    if(capabilities.length!==requested.length)return Response.json({error:"Ungültige Simulator-Berechtigung."},{status:400});
    await db.prepare("DELETE FROM instructor_capabilities WHERE instructor_id=?").bind(id).run();
    if(capabilities.length)await db.batch(capabilities.map(simulator=>db.prepare("INSERT INTO instructor_capabilities (instructor_id,simulator) VALUES (?,?)").bind(id,simulator)));
    return Response.json({updated:true});
  }
  if(body.action==="profile"){
    const name=String(body.name??"").trim(),email=String(body.email??"").trim().toLowerCase(),password=String(body.password??"");
    if(!name||name.length>100||!validEmail(email)||(password&&password.length<12))return Response.json({error:"Name, E-Mail-Adresse oder temporäres Passwort ist ungültig."},{status:400});
    const credentials=password?await hashPassword(password):null;
    const update=credentials?await db.prepare("UPDATE instructors SET name=?,email=?,password_hash=?,password_salt=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(name,email,credentials.hash,credentials.salt,id).run():await db.prepare("UPDATE instructors SET name=?,email=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(name,email,id).run();
    if(!update.meta.changes)return Response.json({error:"Instructor nicht gefunden."},{status:404});
    return Response.json({updated:true});
  }
  await db.prepare("UPDATE instructors SET active=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(active?1:0,id).run();
  return Response.json({updated:true});
}

export async function DELETE(request:Request) {
  if (!(await isValidSession(request, env.DB))) return Response.json({error:"Nicht autorisiert."},{status:401});
  const url=new URL(request.url),instructorIdParam=url.searchParams.get("instructorId"),instructorId=instructorIdParam===null?null:Number(instructorIdParam);
  if(instructorId!==null&&Number.isInteger(instructorId)&&instructorId>0){
    const instructorDb=await ensureInstructorDatabase(env.DB);await instructorDb.batch([
      instructorDb.prepare("UPDATE bookings SET instructor_id=NULL,instructor_assignment_source=NULL WHERE instructor_id=?").bind(instructorId),
      instructorDb.prepare("DELETE FROM instructor_day_assignments WHERE instructor_id=?").bind(instructorId),
      instructorDb.prepare("DELETE FROM instructor_availability WHERE instructor_id=?").bind(instructorId),
      instructorDb.prepare("DELETE FROM instructor_capabilities WHERE instructor_id=?").bind(instructorId),
      instructorDb.prepare("DELETE FROM instructors WHERE id=?").bind(instructorId),
    ]);return Response.json({deleted:true});
  }
  const assignmentIdParam=url.searchParams.get("assignmentId"),assignmentId=assignmentIdParam===null?null:Number(assignmentIdParam);
  if (assignmentId===null||!Number.isInteger(assignmentId)||assignmentId<=0) return Response.json({error:"Ungültige Zuordnung."},{status:400});
  const db=await ensureInstructorDatabase(env.DB); const assignment=await db.prepare("SELECT * FROM instructor_day_assignments WHERE id=?").bind(assignmentId).first<{instructor_id:number;simulator:string;flight_date:string}>();
  if (assignment) await db.batch([db.prepare("DELETE FROM instructor_day_assignments WHERE id=?").bind(assignmentId),db.prepare("UPDATE bookings SET instructor_id=NULL,instructor_assignment_source=NULL WHERE simulator=? AND flight_date=? AND instructor_assignment_source='day'").bind(assignment.simulator,assignment.flight_date)]);
  return Response.json({deleted:true});
}
