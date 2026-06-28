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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

// ---- palette ----
val Bg = Color(0xFF0A0E1A); val Panel = Color(0xFF121A2E); val Panel2 = Color(0xFF1A2540)
val BlueA = Color(0xFF2F6BFF); val Blue2 = Color(0xFF4D8BFF); val TextC = Color(0xFFE6ECFF)
val Muted = Color(0xFF8A97B8); val Good = Color(0xFF1FB574); val Line = Color(0xFF243154)
val RecRed = Color(0xFFE5484D)

// Real output from Dev 2's whisper-small.en, run on model_evaluation/test_medical.wav
const val WHISPER_TRANSCRIPT =
    "Patient presents with a three-day history of severe headaches. " +
    "Blood pressure is 152 over 96. Will prescribe Lisinopril 10mg once a day."

data class Patient(
    val id: Int, val name: String, val initials: String, val age: Int, val sex: String,
    val mrn: String, val lastVisit: String, val condition: String,
    val soapS: String, val soapO: String, val soapA: String, val soapP: String,
    val transcript: String = ""
) { val info get() = "$age y · ${sex.take(1)}" }

object PatientRepo {
    val patients = mutableStateListOf<Patient>()

    fun load(context: android.content.Context) {
        if (patients.isNotEmpty()) return
        val arr = org.json.JSONArray(context.assets.open("patients.json").bufferedReader().use { it.readText() })
        for (i in 0 until arr.length()) {
            val o = arr.getJSONObject(i)
            patients.add(Patient(o.getInt("id"), o.getString("name"), o.getString("initials"),
                o.getInt("age"), o.getString("sex"), o.getString("mrn"), o.getString("lastVisit"),
                o.getString("condition"), o.getString("soapS"), o.getString("soapO"),
                o.getString("soapA"), o.getString("soapP")))
        }
    }

    private val MALE = listOf("James", "David", "Ahmed", "Chen", "Luis", "Noah", "Omar", "Liam")
    private val FEMALE = listOf("Maria", "Sarah", "Priya", "Emma", "Aisha", "Fatima", "Sofia", "Grace")
    private val LAST = listOf("Khan", "Patel", "Smith", "Garcia", "Lee", "Johnson", "Rossi", "Nguyen")
    // condition, subjective, objective, assessment, plan
    private val PROFILES = listOf(
        listOf("Type 2 Diabetes", "reports increased thirst and frequent urination.", "HbA1c 7.6%, fasting glucose 152 mg/dL.", "Type 2 Diabetes, suboptimal control.", "Increase Metformin; dietary counseling; recheck HbA1c in 3 months."),
        listOf("Hypertension", "reports mild headaches; denies chest pain.", "BP 148/92 mmHg, HR 80/min.", "Stage 1 hypertension.", "Start Lisinopril 10mg daily; home BP log; follow-up 4 weeks."),
        listOf("Asthma", "reports nighttime wheeze and cough.", "SpO2 98%, scattered expiratory wheeze.", "Mild persistent asthma.", "Albuterol PRN; add inhaled corticosteroid; spirometry."),
        listOf("GERD", "reports heartburn after meals.", "Abdomen soft, non-tender; vitals stable.", "Gastroesophageal reflux disease.", "Omeprazole 20mg daily; dietary modification."),
    )

    /** Add a new patient of the given sex (used by the 'New patient' record flow). */
    fun addNew(sex: String): Patient {
        val id = (patients.maxOfOrNull { it.id } ?: 0) + 1
        val first = if (sex == "Male") MALE.random() else FEMALE.random()
        val name = "$first ${LAST.random()}"
        val p = PROFILES.random()
        val initials = name.split(" ").take(2).joinToString("") { it.take(1) }.uppercase()
        val pt = Patient(id, name, initials, (28..78).random(), sex,
            "MRN-${(100000..999999).random()}", "Today", p[0],
            "Patient ${p[1]}", p[2], p[3], p[4])
        patients.add(pt)
        return pt
    }
}

enum class Tab { Record, Patients }

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
    var tab by remember { mutableStateOf(Tab.Record) }
    val ctx = androidx.compose.ui.platform.LocalContext.current
    LaunchedEffect(Unit) { PatientRepo.load(ctx) }

    Scaffold(
        containerColor = Bg,
        bottomBar = {
            NavigationBar(containerColor = Panel) {
                NavigationBarItem(
                    selected = tab == Tab.Record, onClick = { tab = Tab.Record },
                    icon = { Icon(Icons.Filled.Mic, null) }, label = { Text("Record") },
                    colors = NavigationBarItemDefaults.colors(selectedIconColor = BlueA, selectedTextColor = BlueA, indicatorColor = Panel2, unselectedIconColor = Muted, unselectedTextColor = Muted)
                )
                NavigationBarItem(
                    selected = tab == Tab.Patients, onClick = { tab = Tab.Patients },
                    icon = { Icon(Icons.Filled.People, null) }, label = { Text("Patients") },
                    colors = NavigationBarItemDefaults.colors(selectedIconColor = BlueA, selectedTextColor = BlueA, indicatorColor = Panel2, unselectedIconColor = Muted, unselectedTextColor = Muted)
                )
            }
        }
    ) { pad ->
        Column(Modifier.padding(pad).fillMaxSize().padding(horizontal = 20.dp, vertical = 14.dp)) {
            StatusBar()
            Spacer(Modifier.height(8.dp))
            Box(Modifier.weight(1f)) {
                when (tab) {
                    Tab.Record -> RecordTab()
                    Tab.Patients -> PatientsTab()
                }
            }
        }
    }
}

// ---------------- RECORD TAB ----------------
private enum class RecStep { Ask, SelectExisting, NewGender, Recording, Soap }

@Composable
fun RecordTab() {
    var step by remember { mutableStateOf(RecStep.Ask) }
    var current by remember { mutableStateOf<Patient?>(null) }
    when (step) {
        RecStep.Ask -> AskExistingOrNew(
            onExisting = { step = RecStep.SelectExisting },
            onNew = { step = RecStep.NewGender }
        )
        RecStep.SelectExisting -> SelectPatientList("Select Patient", back = { step = RecStep.Ask }) {
            current = it; step = RecStep.Recording
        }
        RecStep.NewGender -> GenderPage(back = { step = RecStep.Ask }) { sex ->
            current = PatientRepo.addNew(sex); step = RecStep.Recording
        }
        RecStep.Recording -> RecordingScreen(current, back = { step = RecStep.Ask }) { step = RecStep.Soap }
        RecStep.Soap -> SoapResult(current, onSave = { step = RecStep.Ask }, onDelete = { step = RecStep.Ask })
    }
}

@Composable fun AskExistingOrNew(onExisting: () -> Unit, onNew: () -> Unit) = Column(Modifier.fillMaxSize()) {
    Column(Modifier.weight(1f).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        Box(Modifier.size(64.dp).clip(RoundedCornerShape(16.dp)).background(Brush.linearGradient(listOf(BlueA, Blue2))), Alignment.Center) {
            Icon(Icons.Filled.Mic, null, tint = Color.White, modifier = Modifier.size(32.dp))
        }
        Spacer(Modifier.height(16.dp))
        Text("Start a Visit", color = TextC, fontSize = 22.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp))
        Text("Is this an existing patient or a new patient?", color = Muted, textAlign = TextAlign.Center, fontSize = 14.sp)
    }
    PrimaryButton("👤  Existing Patient", onExisting)
    GhostButton("＋  New Patient", onNew)
    Spacer(Modifier.height(8.dp))
}

@Composable fun GenderPage(back: () -> Unit, onPick: (String) -> Unit) = Column(Modifier.fillMaxSize()) {
    TopBar("New Patient", back)
    Text("Select the patient's gender to continue.", color = Muted, textAlign = TextAlign.Center, fontSize = 13.sp, modifier = Modifier.fillMaxWidth())
    Row(Modifier.weight(1f).fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
        GenderCard("👨", "Male", Modifier.weight(1f)) { onPick("Male") }
        GenderCard("👩", "Female", Modifier.weight(1f)) { onPick("Female") }
    }
}

@Composable fun GenderCard(emoji: String, label: String, mod: Modifier, onClick: () -> Unit) =
    Column(mod.clip(RoundedCornerShape(16.dp)).background(Panel).clickable { onClick() }.padding(vertical = 32.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Text(emoji, fontSize = 44.sp); Spacer(Modifier.height(6.dp)); Text(label, color = TextC, fontWeight = FontWeight.SemiBold)
    }

@Composable fun SelectPatientList(title: String, back: () -> Unit, onPick: (Patient) -> Unit) = Column(Modifier.fillMaxSize()) {
    TopBar(title, back)
    Column(Modifier.weight(1f).verticalScroll(rememberScrollState())) {
        PatientRepo.patients.forEach { p -> PatientRow(p) { onPick(p) } }
    }
}

@Composable fun PatientRow(p: Patient, onClick: () -> Unit) =
    Row(Modifier.fillMaxWidth().padding(vertical = 5.dp).clip(RoundedCornerShape(14.dp)).background(Panel).clickable { onClick() }.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(38.dp).clip(CircleShape).background(Panel2), Alignment.Center) { Text(p.initials, color = Blue2, fontWeight = FontWeight.Bold, fontSize = 12.sp) }
        Spacer(Modifier.width(12.dp))
        Column { Text(p.name, color = TextC, fontWeight = FontWeight.SemiBold); Text("${p.info} · ${p.condition}", color = Muted, fontSize = 12.sp) }
    }

@Composable fun RecordingScreen(patient: Patient?, back: () -> Unit, onDone: () -> Unit) {
    // phase: idle -> recording -> processing
    var phase by remember { mutableStateOf("idle") }
    var sec by remember { mutableStateOf(0) }
    var step by remember { mutableStateOf(0) }
    val proc = listOf("Transcribing", "Extracting History", "Generating Note", "Complete")
    LaunchedEffect(phase) { if (phase == "recording") while (phase == "recording") { delay(1000); sec++ } }
    LaunchedEffect(phase) {
        if (phase == "processing") { step = 0; while (step < proc.size - 1) { delay(900); step++ }; delay(500); onDone() }
    }
    val timer = "00:${(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}"

    Column(Modifier.fillMaxSize()) {
        TopBar("Visit in Progress", if (phase == "idle") back else null)
        Text("${patient?.name ?: "Patient"} · ${patient?.info ?: ""}", color = Muted, textAlign = TextAlign.Center, fontSize = 13.sp, modifier = Modifier.fillMaxWidth())
        Column(Modifier.weight(1f).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            when (phase) {
                "idle" -> {
                    // START button — a circle with a record dot
                    Box(Modifier.size(140.dp).clip(CircleShape).background(Brush.radialGradient(listOf(Blue2, BlueA)))
                        .clickable { sec = 0; phase = "recording" }, Alignment.Center) {
                        Box(Modifier.size(48.dp).clip(CircleShape).background(Color.White))
                    }
                    Spacer(Modifier.height(18.dp))
                    Text("Start Recording", color = TextC, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                    Text("Tap the circle to begin the visit", color = Muted, fontSize = 13.sp)
                }
                "recording" -> {
                    Box(Modifier.size(140.dp).clip(CircleShape).background(RecRed.copy(alpha = 0.16f)), Alignment.Center) {
                        Icon(Icons.Filled.Mic, null, tint = RecRed, modifier = Modifier.size(54.dp))
                    }
                    Spacer(Modifier.height(14.dp))
                    Text("● REC   $timer", color = RecRed, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                    Text("Recording… speak now", color = Muted, fontSize = 13.sp)
                    Spacer(Modifier.height(26.dp))
                    // STOP button — a circle with an X
                    Box(Modifier.size(76.dp).clip(CircleShape).background(RecRed)
                        .clickable { phase = "processing" }, Alignment.Center) {
                        Icon(Icons.Filled.Close, "stop", tint = Color.White, modifier = Modifier.size(38.dp))
                    }
                    Text("Stop", color = Muted, fontSize = 12.sp, modifier = Modifier.padding(top = 6.dp))
                }
                "processing" -> {
                    Box(Modifier.size(120.dp).clip(CircleShape).background(Brush.radialGradient(listOf(Blue2, BlueA))), Alignment.Center) {
                        Icon(Icons.Filled.Autorenew, null, tint = Color.White, modifier = Modifier.size(44.dp))
                    }
                    Spacer(Modifier.height(8.dp))
                    Text("Length recorded: $timer", color = Muted, fontSize = 12.sp)
                    Spacer(Modifier.height(14.dp))
                    proc.forEachIndexed { i, label ->
                        val on = i <= step
                        Text((if (on) "● " else "○ ") + label, color = if (on) Blue2 else Muted, fontSize = 14.sp,
                            fontWeight = if (on) FontWeight.SemiBold else FontWeight.Normal, modifier = Modifier.padding(vertical = 3.dp))
                    }
                }
            }
        }
    }
}

@Composable fun SoapResult(patient: Patient?, onSave: () -> Unit, onDelete: () -> Unit) = Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
    Text("Visit Result", color = TextC, fontSize = 17.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp))
    Text("${patient?.name ?: ""} · ${patient?.info ?: ""}", color = Muted, fontSize = 12.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
    Spacer(Modifier.height(8.dp))
    // REAL Whisper transcript (Dev 2's whisper-small.en)
    Text("🎙  Transcript", color = Blue2, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(vertical = 4.dp))
    Card {
        Text("real · openai/whisper-small.en (Dev 2)", color = Good, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(4.dp))
        Text(WHISPER_TRANSCRIPT, color = TextC, fontSize = 13.sp)
    }
    Spacer(Modifier.height(6.dp))
    // SOAP structured from the transcript (Llama generates this at integration — stub)
    Text("🧠  SOAP Note (auto-structured · Llama stub)", color = Blue2, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(vertical = 4.dp))
    SoapCard("S — Subjective", "Patient presents with a three-day history of severe headaches.")
    SoapCard("O — Objective", "Blood pressure 152/96 mmHg.")
    SoapCard("A — Assessment", "Hypertension with associated headache.")
    SoapCard("P — Plan", "Prescribe Lisinopril 10mg once daily.")
    Spacer(Modifier.height(10.dp))
    PrimaryButton("✓  Save Note & Finish", onSave)
    DeleteButton("🗑  Delete Note", onDelete)
    Spacer(Modifier.height(8.dp))
}

@Composable fun DeleteButton(text: String, onClick: () -> Unit) =
    Button(onClick, Modifier.fillMaxWidth().padding(top = 8.dp),
        colors = ButtonDefaults.buttonColors(containerColor = RecRed.copy(alpha = 0.14f)),
        shape = RoundedCornerShape(14.dp)) {
        Text(text, color = RecRed, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(4.dp))
    }

// ---------------- PATIENTS TAB ----------------
@Composable
fun PatientsTab() {
    var detail by remember { mutableStateOf<Patient?>(null) }
    if (detail == null) {
        Column(Modifier.fillMaxSize()) {
            Text("All Patients (${PatientRepo.patients.size})", color = TextC, fontSize = 17.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp))
            Column(Modifier.weight(1f).verticalScroll(rememberScrollState())) {
                PatientRepo.patients.forEach { p -> PatientRow(p) { detail = p } }
            }
        }
    } else {
        PatientDetail(detail!!) { detail = null }
    }
}

@Composable fun PatientDetail(p: Patient, back: () -> Unit) = Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
    TopBar("Patient Record", back)
    Card {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(44.dp).clip(CircleShape).background(Panel2), Alignment.Center) { Text(p.initials, color = Blue2, fontWeight = FontWeight.Bold) }
            Spacer(Modifier.width(12.dp))
            Column {
                Text(p.name, color = TextC, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text("${p.info} · ${p.mrn}", color = Muted, fontSize = 12.sp)
                Text("Last visit: ${p.lastVisit} · ${p.condition}", color = Muted, fontSize = 12.sp)
            }
        }
    }
    Spacer(Modifier.height(6.dp))
    Text("Latest SOAP Note", color = Blue2, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(vertical = 4.dp))
    SoapCard("S — Subjective", p.soapS)
    SoapCard("O — Objective", p.soapO)
    SoapCard("A — Assessment", p.soapA)
    SoapCard("P — Plan", p.soapP)
    Spacer(Modifier.height(8.dp))
    Text("Transcription", color = Blue2, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(vertical = 4.dp))
    Card {
        Text("🎙  whisper-small.en (Dev 2) · real output", color = Good, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(6.dp))
        Text(if (p.transcript.isNotBlank()) p.transcript else WHISPER_TRANSCRIPT, color = TextC, fontSize = 13.sp)
        Spacer(Modifier.height(6.dp))
        Text("(Demo sample. On-device live transcription pending Dev 1's runtime.)", color = Muted, fontSize = 11.sp)
    }
    Spacer(Modifier.height(12.dp))
}

// ---------------- shared bits ----------------
@Composable fun StatusBar() = Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
    Text("9:41", color = Muted, fontSize = 12.sp); Text("📶 🔋", color = Muted, fontSize = 12.sp)
}
@Composable fun PrimaryButton(text: String, onClick: () -> Unit) =
    Button(onClick, Modifier.fillMaxWidth().padding(top = 8.dp), colors = ButtonDefaults.buttonColors(containerColor = BlueA), shape = RoundedCornerShape(14.dp)) {
        Text(text, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(4.dp))
    }
@Composable fun GhostButton(text: String, onClick: () -> Unit) =
    Button(onClick, Modifier.fillMaxWidth().padding(top = 8.dp), colors = ButtonDefaults.buttonColors(containerColor = Panel2), shape = RoundedCornerShape(14.dp)) {
        Text(text, color = TextC, fontSize = 15.sp, modifier = Modifier.padding(4.dp))
    }
@Composable fun Card(content: @Composable ColumnScope.() -> Unit) =
    Column(Modifier.fillMaxWidth().padding(vertical = 5.dp).clip(RoundedCornerShape(14.dp)).background(Panel).padding(14.dp), content = content)
@Composable fun SoapCard(label: String, body: String) = Card {
    Text(label, color = Blue2, fontSize = 11.sp, fontWeight = FontWeight.Bold); Spacer(Modifier.height(4.dp)); Text(body, color = TextC, fontSize = 13.sp)
}
@Composable fun TopBar(title: String, back: (() -> Unit)? = null) = Box(Modifier.fillMaxWidth().padding(bottom = 8.dp)) {
    if (back != null) Icon(Icons.Filled.ArrowBack, "back", tint = Muted, modifier = Modifier.align(Alignment.CenterStart).clickable { back() })
    Text(title, color = TextC, fontSize = 17.sp, fontWeight = FontWeight.Bold, modifier = Modifier.align(Alignment.Center))
}
