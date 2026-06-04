import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据...');

  const pharmacist = await prisma.user.upsert({
    where: { id: 'pharmacist-001' },
    update: {},
    create: {
      id: 'pharmacist-001',
      name: '张药师',
      role: 'PHARMACIST'
    }
  });
  console.log('创建药师:', pharmacist.name);

  const clerk = await prisma.user.upsert({
    where: { id: 'clerk-001' },
    update: {},
    create: {
      id: 'clerk-001',
      name: '李店员',
      role: 'CLERK'
    }
  });
  console.log('创建店员:', clerk.name);

  const reviewer = await prisma.user.upsert({
    where: { id: 'reviewer-001' },
    update: {},
    create: {
      id: 'reviewer-001',
      name: '王复核',
      role: 'REVIEWER'
    }
  });
  console.log('创建复核人:', reviewer.name);

  const patient1 = await prisma.patient.upsert({
    where: { idCard: '110101199001011234' },
    update: {},
    create: {
      name: '张三',
      idCard: '110101199001011234',
      phone: '13800138001',
      gender: '男',
      birthDate: new Date('1990-01-01')
    }
  });

  const patient2 = await prisma.patient.upsert({
    where: { idCard: '110101199202022345' },
    update: {},
    create: {
      name: '李四',
      idCard: '110101199202022345',
      phone: '13800138002',
      gender: '女',
      birthDate: new Date('1992-02-02')
    }
  });

  const patient3 = await prisma.patient.upsert({
    where: { idCard: '110101198503033456' },
    update: {},
    create: {
      name: '王五',
      idCard: '110101198503033456',
      phone: '13800138003',
      gender: '男',
      birthDate: new Date('1985-03-03')
    }
  });

  const patient4 = await prisma.patient.upsert({
    where: { idCard: '110101197804044567' },
    update: {},
    create: {
      name: '赵六',
      idCard: '110101197804044567',
      phone: '13800138004',
      gender: '女',
      birthDate: new Date('1978-04-04')
    }
  });

  console.log('创建患者数据完成');

  const approvedPrescription = await prisma.prescription.create({
    data: {
      prescriptionNo: 'RX202406010001',
      source: 'HOSPITAL',
      sourceHospital: '市第一人民医院',
      doctorName: '陈医生',
      department: '内科',
      diagnosis: '上呼吸道感染',
      patientId: patient1.id,
      status: 'APPROVED',
      currentHandler: '张药师',
      medicines: {
        create: [
          {
            name: '阿莫西林胶囊',
            specification: '0.25g*24粒',
            dosage: '每次2粒',
            frequency: '每日3次',
            quantity: 2,
            unit: '盒',
            price: 25.5
          },
          {
            name: '布洛芬缓释胶囊',
            specification: '0.3g*20粒',
            dosage: '每次1粒',
            frequency: '每日2次',
            quantity: 1,
            unit: '盒',
            price: 18.0
          }
        ]
      },
      reviews: {
        create: {
          pharmacistId: 'pharmacist-001',
          result: 'APPROVED',
          comments: '处方合理，剂量正常',
          reviewedAt: new Date()
        }
      },
      histories: {
        create: [
          {
            action: '处方接收',
            operatorName: '系统',
            details: '处方 RX202406010001 已接收，来自 市第一人民医院'
          },
          {
            action: '审核通过',
            operatorId: 'pharmacist-001',
            operatorName: '张药师',
            details: '药师审核通过，处方可正常发药'
          }
        ]
      }
    }
  });
  console.log('创建【审核通过】处方:', approvedPrescription.prescriptionNo);

  const dosageIssuePrescription = await prisma.prescription.create({
    data: {
      prescriptionNo: 'RX202406010002',
      source: 'CLINIC',
      sourceHospital: '社区卫生服务中心',
      doctorName: '刘医生',
      department: '全科',
      diagnosis: '高血压',
      patientId: patient2.id,
      status: 'DOSAGE_ISSUE',
      currentHandler: '张药师',
      medicines: {
        create: [
          {
            name: '硝苯地平控释片',
            specification: '30mg*7片',
            dosage: '每次2片',
            frequency: '每日3次',
            quantity: 4,
            unit: '盒',
            price: 35.0,
            notes: '剂量异常偏高'
          }
        ]
      },
      reviews: {
        create: {
          pharmacistId: 'pharmacist-001',
          result: 'DOSAGE_ISSUE',
          dosageSuggestion: '建议调整为每次1片，每日1次',
          comments: '硝苯地平日剂量超出常规范围，请医生确认',
          reviewedAt: new Date()
        }
      },
      histories: {
        create: [
          {
            action: '处方接收',
            operatorName: '系统',
            details: '处方 RX202406010002 已接收，来自 社区卫生服务中心'
          },
          {
            action: '剂量异常',
            operatorId: 'pharmacist-001',
            operatorName: '张药师',
            details: '剂量异常：建议调整为每次1片，每日1次'
          }
        ]
      }
    }
  });
  console.log('创建【剂量异常】处方:', dosageIssuePrescription.prescriptionNo);

  const mismatchPrescription = await prisma.prescription.create({
    data: {
      prescriptionNo: 'RX202406010003',
      source: 'ONLINE',
      sourceHospital: '互联网医院',
      doctorName: '周医生',
      department: '皮肤科',
      diagnosis: '过敏性皮炎',
      patientId: patient3.id,
      status: 'PATIENT_MISMATCH',
      currentHandler: '张药师',
      medicines: {
        create: [
          {
            name: '氯雷他定片',
            specification: '10mg*6片',
            dosage: '每次1片',
            frequency: '每日1次',
            quantity: 2,
            unit: '盒',
            price: 22.0
          }
        ]
      },
      reviews: {
        create: {
          pharmacistId: 'pharmacist-001',
          result: 'PATIENT_MISMATCH',
          comments: '患者身份证号与系统记录不符，需核实身份信息',
          reviewedAt: new Date()
        }
      },
      histories: {
        create: [
          {
            action: '处方接收',
            operatorName: '系统',
            details: '处方 RX202406010003 已接收，来自 互联网医院'
          },
          {
            action: '患者信息不符',
            operatorId: 'pharmacist-001',
            operatorName: '张药师',
            details: '患者信息不符：患者身份证号与系统记录不符，需核实身份信息'
          }
        ]
      }
    }
  });
  console.log('创建【患者信息不符】处方:', mismatchPrescription.prescriptionNo);

  const timeoutPrescription = await prisma.prescription.create({
    data: {
      prescriptionNo: 'RX202405010001',
      source: 'EXTERNAL',
      sourceHospital: '外省某医院',
      doctorName: '孙医生',
      department: '内分泌科',
      diagnosis: '2型糖尿病',
      patientId: patient4.id,
      status: 'TIMEOUT',
      currentHandler: '系统',
      expireAt: new Date('2024-05-15'),
      medicines: {
        create: [
          {
            name: '二甲双胍片',
            specification: '0.5g*30片',
            dosage: '每次1片',
            frequency: '每日2次',
            quantity: 3,
            unit: '盒',
            price: 28.0
          },
          {
            name: '格列美脲片',
            specification: '2mg*30片',
            dosage: '每次1片',
            frequency: '每日1次',
            quantity: 1,
            unit: '盒',
            price: 45.0
          }
        ]
      },
      histories: {
        create: [
          {
            action: '处方接收',
            operatorName: '系统',
            details: '处方 RX202405010001 已接收，来自 外省某医院'
          },
          {
            action: '超时未取',
            operatorName: '系统',
            details: '处方超过有效期未取药，自动标记为超时'
          }
        ]
      }
    }
  });
  console.log('创建【超时未取】处方:', timeoutPrescription.prescriptionNo);

  console.log('\n数据初始化完成!');
  console.log('========================================');
  console.log('用户账号:');
  console.log('  药师: 张药师 (PHARMACIST)');
  console.log('  店员: 李店员 (CLERK)');
  console.log('  复核人: 王复核 (REVIEWER)');
  console.log('\n示例处方:');
  console.log('  1. RX202406010001 - 审核通过 (张三)');
  console.log('  2. RX202406010002 - 剂量异常 (李四)');
  console.log('  3. RX202406010003 - 患者信息不符 (王五)');
  console.log('  4. RX202405010001 - 超时未取 (赵六)');
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
