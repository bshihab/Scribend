import json
from sentence_transformers import SentenceTransformer

# Realistic medical sentences for Dev 3 to test clustering/search
sentences = [
    "Patient presents with severe headache and blurred vision.",
    "Blood pressure is elevated at 150/95.",
    "Prescribed Lisinopril 10mg daily for hypertension.",
    "Patient complains of frequent urination and increased thirst.",
    "Fasting blood glucose is 145 mg/dL.",
    "Prescribed Metformin 500mg twice daily for Type 2 Diabetes.",
    "Patient reports mild chest pain when climbing stairs.",
    "ECG shows normal sinus rhythm with no acute ischemic changes.",
    "Patient has a history of asthma, currently using Albuterol.",
    "Spirometry shows mild obstructive pattern, reversible with bronchodilator.",
    "Complains of lower back pain radiating to the left leg.",
    "Straight leg raise test is positive on the left at 45 degrees.",
    "Patient is feeling anxious and having trouble sleeping.",
    "Prescribed a short course of Zolpidem for insomnia.",
    "Routine physical exam. Patient is feeling well.",
    "Lipid panel shows elevated LDL cholesterol at 160 mg/dL.",
    "Started Atorvastatin 20mg nightly.",
    "Patient reports acid reflux after meals.",
    "Advised dietary modifications and prescribed Omeprazole 20mg.",
    "Follow-up appointment scheduled in 4 weeks."
]

print("Loading MiniLM model to generate sample vectors...")
model = SentenceTransformer("all-MiniLM-L6-v2")

print("Generating embeddings...")
# Generate embeddings (SentenceTransformers normalizes them automatically by default for some models, but MiniLM uses L2 norm for cosine)
embeddings = model.encode(sentences, convert_to_numpy=True, normalize_embeddings=True)

# Prepare JSON output
output_data = []
for i, (sentence, embedding) in enumerate(zip(sentences, embeddings)):
    output_data.append({
        "id": i + 1,
        "text": sentence,
        "vector": embedding.tolist()
    })

output_file = "dev3_sample_vectors.json"
with open(output_file, "w") as f:
    json.dump(output_data, f, indent=2)

print(f"✅ Generated {len(output_data)} vectors and saved to {output_file}!")
print(f"Vector dimension: {len(embeddings[0])}")
print(f"Data type: {type(embeddings[0][0]).__name__}")
