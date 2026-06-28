package com.scribend.uiprototype

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext

// ---- Scribend palette (matches the design screenshot) ----
val Bg = Color(0xFF0A0E1A)
val Panel = Color(0xFF121A2E)
val Panel2 = Color(0xFF1A2540)
val BlueA = Color(0xFF2F6BFF)
val Blue2 = Color(0xFF4D8BFF)
val TextC = Color(0xFFE6ECFF)
val Muted = Color(0xFF8A97B8)
val Good = Color(0xFF1FB574)
val Line = Color(0xFF243154)

enum class Screen { Welcome, Permissions, Home, PatientType, SelectPatient, Visit, Soap, Saved, DbSearch, PatientSoap }

data class Patient(
    val id: Int, val name: String, val initials: String, val age: Int, val sex: String,
    val mrn: String, val lastVisit: String, val condition: String,
    val soapS: String, val soapO: String, val soapA: String, val soapP: String
) {
    val info: String get() = "$age y · ${sex.take(1)}"
}

/** Holds the patient list: loaded from the Faker-generated assets/patients.json,
 *  plus the ability to add new fake patients on demand (in-memory). */
object PatientRepo {
    val patients = mutableStateListOf<Patient>()

    fun load(context: android.content.Context) {
        if (patients.isNotEmpty()) return
        val arr = org.json.JSONArray(context.assets.open("patients.json").bufferedReader().use { it.readText() })
        for (i in 0 until arr.length()) {
            val o = arr.getJSONObject(i)
            patients.add(
                Patient(o.getInt("id"), o.getString("name"), o.getString("initials"),
                    o.getInt("age"), o.getString("sex"), o.getString("mrn"), o.getString("lastVisit"),
                    o.getString("condition"), o.getString("soapS"), o.getString("soapO"),
                    o.getString("soapA"), o.getString("soapP"))
            )
        }
    }

    private val FIRST = listOf("James", "Maria", "David", "Sarah", "Ahmed", "Priya", "Chen", "Emma", "Luis", "Aisha")
    private val LAST = listOf("Khan", "Patel", "Smith", "Garcia", "Lee", "Johnson", "Mehta", "Rossi", "Ali", "Nguyen")
    // condition, subjective, objective, assessment, plan
    private val PROFILES = listOf(
        listOf("Type 2 Diabetes", "reports increased thirst and frequent urination.", "HbA1c 7.6%, fasting glucose 152 mg/dL. No acute distress.", "Type 2 Diabetes, suboptimal control.", "Increase Metformin; dietary counseling; recheck HbA1c in 3 months."),
        listOf("Hypertension", "reports mild headaches; denies chest pain.", "BP 148/92 mmHg, HR 80/min.", "Stage 1 hypertension.", "Start Lisinopril 10mg daily; home BP log; follow-up 4 weeks."),
        listOf("Asthma", "reports nighttime wheeze and cough.", "SpO2 98%, scattered expiratory wheeze.", "Mild persistent asthma.", "Albuterol PRN; add inhaled corticosteroid; spirometry."),
        listOf("GERD", "reports heartburn after meals.", "Abdomen soft, non-tender; vitals stable.", "Gastroesophageal reflux disease.", "Omeprazole 20mg daily; dietary modification."),
    )

    fun addRandom() {
        val id = (patients.maxOfOrNull { it.id } ?: 0) + 1
        val name = "${FIRST.random()} ${LAST.random()}"
        val sex = listOf("Male", "Female").random()
        val p = PROFILES.random()
        val initials = name.split(" ").take(2).joinToString("") { it.take(1) }.uppercase()
        patients.add(
            Patient(id, name, initials, (28..78).random(), sex,
                "MRN-${(100000..999999).random()}", "Today", p[0],
                "Patient ${p[1]}", p[2], p[3], p[4])
        )
    }
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(colorScheme = darkColorScheme(primary = BlueA, background = Bg, surface = Panel)) {
                ScribendApp()
            }
        }
    }
}

@Composable
fun ScribendApp() {
    var screen by remember { mutableStateOf(Screen.Welcome) }
    var selected by remember { mutableStateOf<Patient?>(null) }
    var selectFor by remember { mutableStateOf("view") }   // "visit" or "view"
    val ctx = LocalContext.current
    LaunchedEffect(Unit) { PatientRepo.load(ctx) }

    Surface(Modifier.fillMaxSize(), color = Bg) {
        Column(Modifier.fillMaxSize().padding(20.dp)) {
            StatusBar()
            Spacer(Modifier.height(8.dp))
            Box(Modifier.weight(1f)) {
                when (screen) {
                    Screen.Welcome -> WelcomeScreen { screen = Screen.Permissions }
                    Screen.Permissions -> PermissionsScreen { screen = Screen.Home }
                    Screen.Home -> HomeScreen(
                        onStart = { selectFor = "visit"; screen = Screen.PatientType },
                        onHistory = { selectFor = "view"; screen = Screen.SelectPatient },
                        onLiveDb = { screen = Screen.DbSearch }
                    )
                    Screen.DbSearch -> DbSearchScreen { screen = Screen.Home }
                    Screen.PatientType -> PatientTypeScreen(
                        back = { screen = Screen.Home },
                        next = { screen = Screen.SelectPatient }
                    )
                    Screen.SelectPatient -> SelectPatientScreen(
                        back = { screen = Screen.Home },
                        onPick = { selected = it; screen = if (selectFor == "visit") Screen.Visit else Screen.PatientSoap }
                    )
                    Screen.PatientSoap -> PatientSoapScreen(
                        patient = selected,
                        back = { screen = Screen.SelectPatient },
                        onNewVisit = { screen = Screen.Visit }
                    )
                    Screen.Visit -> VisitScreen(
                        patient = selected,
                        back = { screen = Screen.SelectPatient },
                        onDone = { screen = Screen.Soap }
                    )
                    Screen.Soap -> SoapScreen(
                        back = { screen = Screen.Visit },
                        onSave = { screen = Screen.Saved }
                    )
                    Screen.Saved -> SavedScreen(
                        patient = selected,
                        onView = { screen = Screen.Soap },
                        onNew = { screen = Screen.Home }
                    )
                }
            }
        }
    }
}

@Composable fun StatusBar() = Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
    Text("9:41", color = Muted, fontSize = 12.sp)
    Text("📶 🔋", color = Muted, fontSize = 12.sp)
}

@Composable fun PrimaryButton(text: String, onClick: () -> Unit) =
    Button(onClick, Modifier.fillMaxWidth().padding(top = 8.dp),
        colors = ButtonDefaults.buttonColors(containerColor = BlueA),
        shape = RoundedCornerShape(14.dp)) { Text(text, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(4.dp)) }

@Composable fun GhostButton(text: String, onClick: () -> Unit) =
    Button(onClick, Modifier.fillMaxWidth().padding(top = 8.dp),
        colors = ButtonDefaults.buttonColors(containerColor = Panel2),
        shape = RoundedCornerShape(14.dp)) { Text(text, color = TextC, fontSize = 15.sp, modifier = Modifier.padding(4.dp)) }

@Composable fun Card(content: @Composable ColumnScope.() -> Unit) =
    Column(Modifier.fillMaxWidth().padding(vertical = 5.dp).clip(RoundedCornerShape(14.dp))
        .background(Panel).padding(14.dp), content = content)

@Composable fun TopBar(title: String, back: (() -> Unit)? = null) =
    Box(Modifier.fillMaxWidth().padding(bottom = 8.dp)) {
        if (back != null) Icon(Icons.Filled.ArrowBack, "back", tint = Muted,
            modifier = Modifier.align(Alignment.CenterStart).clickable { back() })
        Text(title, color = TextC, fontSize = 17.sp, fontWeight = FontWeight.Bold,
            modifier = Modifier.align(Alignment.Center))
    }

// ---------------- Screens ----------------
@Composable fun WelcomeScreen(next: () -> Unit) = Column(Modifier.fillMaxSize()) {
    Column(Modifier.weight(1f).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center) {
        Box(Modifier.size(72.dp).clip(RoundedCornerShape(18.dp))
            .background(Brush.linearGradient(listOf(BlueA, Blue2))), Alignment.Center) {
            Icon(Icons.Filled.Edit, null, tint = Color.White, modifier = Modifier.size(34.dp))
        }
        Spacer(Modifier.height(16.dp))
        Text("Scribend", color = TextC, fontSize = 26.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(10.dp))
        Text("Your privacy.\nYour device.\nYour patients.", color = Muted,
            textAlign = TextAlign.Center, fontSize = 14.sp)
        Spacer(Modifier.height(20.dp))
        Pill("🛡  100% On-Device")
    }
    PrimaryButton("Get Started", next)
}

@Composable fun PermissionsScreen(next: () -> Unit) = Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
    TopBar("Permissions")
    Text("Scribend needs the following access to work offline and protect your data.",
        color = Muted, textAlign = TextAlign.Center, fontSize = 13.sp, modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp))
    PermCard(Icons.Filled.Mic, "Microphone Access", "For audio recording of patient conversations · Required")
    PermCard(Icons.Filled.Folder, "Local Storage Access", "For saving recordings and notes securely · Required")
    Spacer(Modifier.height(8.dp))
    Text("🔒 Nothing leaves your device. 100% offline processing.", color = Muted,
        textAlign = TextAlign.Center, fontSize = 12.sp, modifier = Modifier.fillMaxWidth())
    Spacer(Modifier.height(12.dp))
    PrimaryButton("Continue", next)
}

@Composable fun PermCard(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, sub: String) = Card {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, tint = Blue2, modifier = Modifier.size(26.dp))
        Spacer(Modifier.width(12.dp))
        Column {
            Text(title, color = TextC, fontWeight = FontWeight.SemiBold)
            Text(sub, color = Muted, fontSize = 12.sp)
        }
    }
}

@Composable fun HomeScreen(onStart: () -> Unit, onHistory: () -> Unit, onLiveDb: () -> Unit) = Column(Modifier.fillMaxSize()) {
    TopBar("☰   Scribend")
    Pill("✅ Offline Mode Active — all data stays on this device")
    Column(Modifier.weight(1f).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center) {
        Text("🏔", fontSize = 40.sp)
        Text("Ready for your next visit.", color = Muted, fontSize = 13.sp)
    }
    PrimaryButton("🎙  Start Visit", onStart)
    GhostButton("👤  Patient History", onHistory)
    GhostButton("🔎  Patient History (Live DB)", onLiveDb)
}

@Composable fun DbSearchScreen(back: () -> Unit) {
    val ctx = LocalContext.current
    var ready by remember { mutableStateOf(false) }
    var chosen by remember { mutableStateOf<String?>(null) }
    var results by remember { mutableStateOf<List<Pair<Double, String>>>(emptyList()) }
    LaunchedEffect(Unit) { withContext(Dispatchers.IO) { ScribendDb.init(ctx) }; ready = true }
    val queries = remember(ready) { if (ready) ScribendDb.queries(ctx) else emptyList() }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        TopBar("Patient History — Live DB", back)
        if (!ready) {
            Text("Loading on-device database…", color = Muted, fontSize = 13.sp)
        } else {
            Pill("⚡ Real sqlite-vec on-device · ${ScribendDb.noteCount} notes loaded")
            Text("Tap a query — runs a REAL cosine search in the C engine on this phone:",
                color = Muted, fontSize = 13.sp, modifier = Modifier.padding(vertical = 8.dp))
            queries.forEach { (text, emb) ->
                GhostButton(text) { chosen = text; results = ScribendDb.search(emb, 3) }
            }
            if (chosen != null) {
                Spacer(Modifier.height(12.dp))
                Text("📋 Retrieved from live DB (top 3) for: \"$chosen\"",
                    color = Blue2, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                results.forEachIndexed { i, (dist, txt) ->
                    Card {
                        Text("#${i + 1}  ·  cosine distance ${"%.4f".format(dist)}",
                            color = Blue2, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(4.dp))
                        Text(txt, color = TextC, fontSize = 13.sp)
                    }
                }
                if (results.isNotEmpty()) {
                    Spacer(Modifier.height(14.dp))
                    Text("🧠 SOAP Note (organized from the retrieved history)",
                        color = Blue2, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    SoapCard("S — Subjective", "Doctor query: \"$chosen\". Most relevant history: ${results[0].second}")
                    SoapCard("O — Objective",
                        if (results.size > 1) results.drop(1).joinToString("  •  ") { it.second } else "—")
                    SoapCard("A — Assessment", "Based on retrieved patient history (closest match above).")
                    SoapCard("P — Plan", "Final plan generated on-device by Llama-3.2 at integration (stub for now).")
                }
            }
        }
    }
}

@Composable fun PatientTypeScreen(back: () -> Unit, next: () -> Unit) = Column(Modifier.fillMaxSize()) {
    TopBar("Select Patient Type", back)
    Text("Choose the patient's gender to continue.", color = Muted,
        textAlign = TextAlign.Center, fontSize = 13.sp, modifier = Modifier.fillMaxWidth())
    Row(Modifier.weight(1f).fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically) {
        GenderCard("👨", "Male", Modifier.weight(1f), next)
        GenderCard("👩", "Female", Modifier.weight(1f), next)
    }
}

@Composable fun GenderCard(emoji: String, label: String, mod: Modifier, onClick: () -> Unit) =
    Column(mod.clip(RoundedCornerShape(16.dp)).background(Panel).clickable { onClick() }.padding(vertical = 28.dp),
        horizontalAlignment = Alignment.CenterHorizontally) {
        Text(emoji, fontSize = 40.sp)
        Spacer(Modifier.height(6.dp))
        Text(label, color = TextC, fontWeight = FontWeight.SemiBold)
    }

@Composable fun SelectPatientScreen(back: () -> Unit, onPick: (Patient) -> Unit) = Column(Modifier.fillMaxSize()) {
    TopBar("Select Patient", back)
    OutlinedTextField("", {}, Modifier.fillMaxWidth(), enabled = false,
        placeholder = { Text("🔍 Search patients", color = Muted) },
        colors = OutlinedTextFieldDefaults.colors(unfocusedContainerColor = Panel, disabledContainerColor = Panel,
            disabledBorderColor = Line, disabledPlaceholderColor = Muted))
    Spacer(Modifier.height(10.dp))
    Column(Modifier.weight(1f).verticalScroll(rememberScrollState())) {
        PatientRepo.patients.forEach { p ->
            Row(Modifier.fillMaxWidth().padding(vertical = 5.dp).clip(RoundedCornerShape(14.dp))
                .background(Panel).clickable { onPick(p) }.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(38.dp).clip(CircleShape).background(Panel2), Alignment.Center) {
                    Text(p.initials, color = Blue2, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(p.name, color = TextC, fontWeight = FontWeight.SemiBold)
                    Text("${p.info} · Last visit: ${p.lastVisit}", color = Muted, fontSize = 12.sp)
                }
            }
        }
    }
    GhostButton("＋  New Patient (Faker)") { PatientRepo.addRandom() }
}

@Composable fun PatientSoapScreen(patient: Patient?, back: () -> Unit, onNewVisit: () -> Unit) {
    if (patient == null) { Text("No patient selected", color = Muted); return }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        TopBar("Patient Record", back)
        Card {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(44.dp).clip(CircleShape).background(Panel2), Alignment.Center) {
                    Text(patient.initials, color = Blue2, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(patient.name, color = TextC, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Text("${patient.info} · ${patient.mrn}", color = Muted, fontSize = 12.sp)
                    Text("Last visit: ${patient.lastVisit} · ${patient.condition}", color = Muted, fontSize = 12.sp)
                }
            }
        }
        Spacer(Modifier.height(8.dp))
        Text("Latest SOAP Note", color = Blue2, fontSize = 13.sp, fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(vertical = 4.dp))
        SoapCard("S — Subjective", patient.soapS)
        SoapCard("O — Objective", patient.soapO)
        SoapCard("A — Assessment", patient.soapA)
        SoapCard("P — Plan", patient.soapP)
        Spacer(Modifier.height(10.dp))
        PrimaryButton("🎙  Start New Visit", onNewVisit)
    }
}

@Composable fun VisitScreen(patient: Patient?, back: () -> Unit, onDone: () -> Unit) {
    val steps = listOf("Recording…", "Transcribing", "Extracting History", "Generating Note", "Complete")
    var step by remember { mutableStateOf(0) }
    var started by remember { mutableStateOf(false) }
    var seconds by remember { mutableStateOf(0) }

    LaunchedEffect(started) {
        if (started) {
            while (step < steps.size - 1) { delay(900); step++ }
            delay(600); onDone()
        }
    }
    LaunchedEffect(started) { while (started) { delay(1000); seconds++ } }

    Column(Modifier.fillMaxSize()) {
        TopBar("Visit in Progress", back)
        Text("${patient?.name ?: "Patient"} · ${patient?.info ?: ""}", color = Muted,
            textAlign = TextAlign.Center, fontSize = 13.sp, modifier = Modifier.fillMaxWidth())
        Column(Modifier.weight(1f).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center) {
            Box(Modifier.size(120.dp).clip(CircleShape)
                .background(Brush.radialGradient(listOf(Blue2, BlueA)))
                .clickable { if (!started) started = true }, Alignment.Center) {
                Icon(Icons.Filled.Mic, "mic", tint = Color.White, modifier = Modifier.size(46.dp))
            }
            Spacer(Modifier.height(12.dp))
            val mm = (seconds / 60).toString().padStart(2, '0')
            val ss = (seconds % 60).toString().padStart(2, '0')
            Text("00:$mm:$ss", color = TextC, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(12.dp))
            if (!started) Text("Tap the mic to start", color = Muted, fontSize = 13.sp)
            steps.forEachIndexed { i, label ->
                val on = started && i <= step
                Text((if (on) "● " else "○ ") + label,
                    color = if (on) Blue2 else Muted, fontSize = 13.sp,
                    fontWeight = if (on) FontWeight.SemiBold else FontWeight.Normal,
                    modifier = Modifier.padding(vertical = 3.dp))
            }
        }
    }
}

@Composable fun SoapScreen(back: () -> Unit, onSave: () -> Unit) = Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
    TopBar("SOAP Note", back)
    SoapCard("S — Subjective", "Patient reports headache and dizziness for 2 days. Mild fever last night. Good appetite.")
    SoapCard("O — Objective", "BP 120/80 mmHg · Pulse 84/min · Temp 98.6°F. No acute distress.")
    SoapCard("A — Assessment", "Tension-type headache. Uncomplicated.")
    SoapCard("P — Plan", "Paracetamol 650 mg OD. Advice: rest, fluids, hydration.")
    Spacer(Modifier.height(10.dp))
    PrimaryButton("Save Note Locally", onSave)
}

@Composable fun SoapCard(label: String, body: String) = Card {
    Text(label, color = Blue2, fontSize = 11.sp, fontWeight = FontWeight.Bold)
    Spacer(Modifier.height(4.dp))
    Text(body, color = TextC, fontSize = 13.sp)
}

@Composable fun SavedScreen(patient: Patient?, onView: () -> Unit, onNew: () -> Unit) = Column(Modifier.fillMaxSize()) {
    Column(Modifier.weight(1f).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center) {
        Box(Modifier.size(80.dp).clip(CircleShape).background(Good.copy(alpha = 0.18f)), Alignment.Center) {
            Icon(Icons.Filled.CheckCircle, null, tint = Good, modifier = Modifier.size(46.dp))
        }
        Spacer(Modifier.height(14.dp))
        Text("Note Saved Successfully!", color = TextC, fontSize = 18.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(6.dp))
        Text("Your note has been saved securely on this device.", color = Muted,
            textAlign = TextAlign.Center, fontSize = 13.sp)
        Spacer(Modifier.height(16.dp))
        Card {
            Text(patient?.name ?: "Patient", color = TextC, fontWeight = FontWeight.SemiBold)
            Text("${patient?.info ?: ""} · Visit: 12 May 2025, 10:21 AM", color = Muted, fontSize = 12.sp)
        }
    }
    GhostButton("View Note", onView)
    PrimaryButton("Start New Visit", onNew)
}

@Composable fun Pill(text: String) =
    Box(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp))
        .background(Good.copy(alpha = 0.14f)).padding(10.dp), Alignment.Center) {
        Text(text, color = Good, fontSize = 12.sp, textAlign = TextAlign.Center)
    }
