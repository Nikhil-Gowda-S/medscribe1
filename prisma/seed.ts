import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create a test doctor
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@medscribe.com' },
    update: {},
    create: {
      email: 'doctor@medscribe.com',
      name: 'Dr. John Smith',
      password: hashedPassword,
      role: 'doctor',
    },
  });

  console.log('Created doctor:', doctor.email);

  // Create sample patients
  const patients = await Promise.all([
    prisma.patient.upsert({
      where: { id: 'patient-1' },
      update: {},
      create: {
        id: 'patient-1',
        firstName: 'Jane',
        lastName: 'Doe',
        dateOfBirth: new Date('1980-05-15'),
        gender: 'Female',
        phone: '+1-555-0101',
        email: 'jane.doe@email.com',
        medicalRecordNumber: 'MRN-001',
        doctorId: doctor.id,
      },
    }),
    prisma.patient.upsert({
      where: { id: 'patient-2' },
      update: {},
      create: {
        id: 'patient-2',
        firstName: 'John',
        lastName: 'Smith',
        dateOfBirth: new Date('1975-03-20'),
        gender: 'Male',
        phone: '+1-555-0102',
        medicalRecordNumber: 'MRN-002',
        doctorId: doctor.id,
      },
    }),
    prisma.patient.upsert({
      where: { id: 'patient-3' },
      update: {},
      create: {
        id: 'patient-3',
        firstName: 'Sarah',
        lastName: 'Johnson',
        dateOfBirth: new Date('1990-08-10'),
        gender: 'Female',
        phone: '+1-555-0103',
        medicalRecordNumber: 'MRN-003',
        doctorId: doctor.id,
      },
    }),
  ]);

  console.log('Created patients:', patients.length);

  // Create sample consultation
  const consultation = await prisma.consultation.create({
    data: {
      patientId: patients[0].id,
      doctorId: doctor.id,
      transcript: `Patient presents with chest pain that started approximately 2 hours ago. The pain is described as pressure-like, located in the substernal area, radiating to the left arm. Associated symptoms include shortness of breath and diaphoresis. Patient denies nausea or vomiting. Past medical history significant for hypertension and hyperlipidemia. Family history positive for coronary artery disease in father. Physical examination reveals blood pressure 150/90, heart rate 88 bpm, regular rhythm. Lungs clear bilaterally. No peripheral edema. ECG shows ST elevation in leads II, III, and aVF. Assessment: Acute ST-elevation myocardial infarction. Plan: Admit to cardiac care unit, start dual antiplatelet therapy, statin, beta-blocker, and ACE inhibitor. Cardiology consult. Cardiac catheterization scheduled for tomorrow morning.`,
      status: 'finalized',
    },
  });

  console.log('Created consultation:', consultation.id);

  console.log('Seeding completed!');
  console.log('\nTest credentials:');
  console.log('Email: doctor@medscribe.com');
  console.log('Password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
