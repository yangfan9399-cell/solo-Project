import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.resident.create({
    data: {
      name: '张三',
      idCardNumber: '110101199001011234',
      phone: '13800138001',
      address: '朝阳区幸福小区1号楼101室',
      houses: {
        create: {
          houseNumber: '1-101',
          area: 85.5,
          buildingType: '住宅',
          location: '幸福小区',
          district: '朝阳区'
        }
      },
      agreements: {
        create: {
          agreementNo: 'QY-2024-0001',
          houseId: '',
          signingDate: new Date('2024-01-15'),
          status: 'COMPENSATED',
          totalCompensation: 2565000,
          paymentStatus: 'PAID',
          handlerId: 'U001',
          handlerName: '李征收',
          evaluation: {
            create: {
              evaluatorId: 'U002',
              evaluatorName: '王评估',
              grossArea: 85.5,
              netArea: 78.2,
              unitPrice: 30000,
              totalAmount: 2565000,
              status: 'CONFIRMED',
              reviewed: true,
              reviewResult: '审核通过',
              reviewDate: new Date('2024-01-18')
            }
          },
          acceptance: {
            create: {
              inspectorId: 'U003',
              inspectorName: '张验收',
              checkDate: new Date('2024-01-20'),
              status: 'PASSED'
            }
          },
          compensation: {
            create: {
              reviewerId: 'U004',
              reviewerName: '赵财务',
              reviewDate: new Date('2024-01-22'),
              amount: 2565000,
              status: 'PAID',
              paymentDate: new Date('2024-01-25')
            }
          },
          historyNodes: {
            create: [
              { nodeType: 'AGREEMENT_REGISTERED', operatorId: 'U001', operatorName: '李征收', timestamp: new Date('2024-01-10') },
              { nodeType: 'AGREEMENT_SIGNED', operatorId: 'U001', operatorName: '李征收', timestamp: new Date('2024-01-15') },
              { nodeType: 'EVALUATION_CONFIRMED', operatorId: 'U002', operatorName: '王评估', timestamp: new Date('2024-01-18') },
              { nodeType: 'ACCEPTANCE_PASSED', operatorId: 'U003', operatorName: '张验收', timestamp: new Date('2024-01-20') },
              { nodeType: 'COMPENSATION_REVIEWED', operatorId: 'U004', operatorName: '赵财务', timestamp: new Date('2024-01-22') },
              { nodeType: 'COMPENSATION_APPROVED', operatorId: 'U004', operatorName: '赵财务', timestamp: new Date('2024-01-24') },
              { nodeType: 'COMPENSATION_PAID', operatorId: 'U004', operatorName: '赵财务', timestamp: new Date('2024-01-25') }
            ]
          }
        }
      }
    }
  })

  await prisma.resident.create({
    data: {
      name: '李四',
      idCardNumber: '110102198505156789',
      phone: '13900139002',
      address: '海淀区阳光花园3号楼202室',
      houses: {
        create: {
          houseNumber: '3-202',
          area: 120.0,
          buildingType: '住宅',
          location: '阳光花园',
          district: '海淀区'
        }
      },
      agreements: {
        create: {
          agreementNo: 'QY-2024-0002',
          houseId: '',
          signingDate: new Date('2024-02-01'),
          status: 'DISPUTED',
          totalCompensation: 0,
          paymentStatus: 'FROZEN',
          frozen: true,
          freezeReason: '面积争议',
          handlerId: 'U001',
          handlerName: '李征收',
          evaluation: {
            create: {
              evaluatorId: 'U002',
              evaluatorName: '王评估',
              grossArea: 115.0,
              netArea: 105.0,
              unitPrice: 32000,
              totalAmount: 3680000,
              status: 'DISPUTED',
              disputeReason: '业主主张面积为130平方米，与评估结果存在差异'
            }
          },
          historyNodes: {
            create: [
              { nodeType: 'AGREEMENT_REGISTERED', operatorId: 'U001', operatorName: '李征收', timestamp: new Date('2024-01-28') },
              { nodeType: 'AGREEMENT_SIGNED', operatorId: 'U001', operatorName: '李征收', timestamp: new Date('2024-02-01') },
              { nodeType: 'EVALUATION_CONFIRMED', operatorId: 'U002', operatorName: '王评估', timestamp: new Date('2024-02-05') },
              { nodeType: 'AREA_DISPUTE', operatorId: 'U002', operatorName: '王评估', timestamp: new Date('2024-02-06') },
              { nodeType: 'FROZEN', operatorId: 'U001', operatorName: '李征收', timestamp: new Date('2024-02-06') },
              { nodeType: 'REVIEW_REQUESTED', operatorId: 'U001', operatorName: '李征收', timestamp: new Date('2024-02-07') }
            ]
          }
        }
      }
    }
  })

  await prisma.resident.create({
    data: {
      name: '王五',
      idCardNumber: '110103197810204567',
      phone: '13600136003',
      address: '西城区古城小区5号楼301室',
      houses: {
        create: {
          houseNumber: '5-301',
          area: 65.0,
          buildingType: '住宅',
          location: '古城小区',
          district: '西城区'
        }
      },
      agreements: {
        create: {
          agreementNo: 'QY-2024-0003',
          houseId: '',
          signingDate: new Date('2024-02-10'),
          status: 'REVIEWING',
          totalCompensation: 1950000,
          paymentStatus: 'FROZEN',
          frozen: true,
          freezeReason: '证件缺失',
          handlerId: 'U001',
          handlerName: '李征收',
          evaluation: {
            create: {
              evaluatorId: 'U002',
              evaluatorName: '王评估',
              grossArea: 65.0,
              netArea: 59.8,
              unitPrice: 30000,
              totalAmount: 1950000,
              status: 'CONFIRMED',
              reviewed: true,
              reviewResult: '审核通过',
              reviewDate: new Date('2024-02-12')
            }
          },
          acceptance: {
            create: {
              inspectorId: 'U003',
              inspectorName: '张验收',
              checkDate: new Date('2024-02-15'),
              status: 'PASSED'
            }
          },
          historyNodes: {
            create: [
              { nodeType: 'AGREEMENT_REGISTERED', operatorId: 'U001', operatorName: '李征收', timestamp: new Date('2024-02-08') },
              { nodeType: 'AGREEMENT_SIGNED', operatorId: 'U001', operatorName: '李征收', timestamp: new Date('2024-02-10') },
              { nodeType: 'EVALUATION_CONFIRMED', operatorId: 'U002', operatorName: '王评估', timestamp: new Date('2024-02-12') },
              { nodeType: 'ACCEPTANCE_PASSED', operatorId: 'U003', operatorName: '张验收', timestamp: new Date('2024-02-15') },
              { nodeType: 'COMPENSATION_REVIEWED', operatorId: 'U004', operatorName: '赵财务', timestamp: new Date('2024-02-18') },
              { nodeType: 'FROZEN', operatorId: 'U004', operatorName: '赵财务', timestamp: new Date('2024-02-18') },
              { nodeType: 'REVIEW_REQUESTED', operatorId: 'U004', operatorName: '赵财务', timestamp: new Date('2024-02-19') }
            ]
          }
        }
      }
    }
  })

  await prisma.resident.create({
    data: {
      name: '赵六',
      idCardNumber: '110104198203107890',
      phone: '13700137004',
      address: '东城区和谐家园2号楼401室',
      houses: {
        create: {
          houseNumber: '2-401',
          area: 95.5,
          buildingType: '住宅',
          location: '和谐家园',
          district: '东城区'
        }
      },
      agreements: {
        create: {
          agreementNo: 'QY-2024-0004',
          houseId: '',
          signingDate: new Date('2024-02-20'),
          status: 'EVALUATED',
          totalCompensation: 0,
          paymentStatus: 'UNPAID',
          handlerId: 'U001',
          handlerName: '李征收',
          evaluation: {
            create: {
              evaluatorId: 'U002',
              evaluatorName: '王评估',
              grossArea: 95.5,
              netArea: 87.8,
              unitPrice: 31000,
              totalAmount: 2960500,
              status: 'CONFIRMED',
              reviewed: true,
              reviewResult: '审核通过',
              reviewDate: new Date('2024-02-22')
            }
          },
          acceptance: {
            create: {
              inspectorId: 'U003',
              inspectorName: '张验收',
              checkDate: new Date('2024-02-25'),
              status: 'FAILED',
              remarks: '房屋内仍有部分家具未搬离，存在私搭乱建情况'
            }
          },
          historyNodes: {
            create: [
              { nodeType: 'AGREEMENT_REGISTERED', operatorId: 'U001', operatorName: '李征收', timestamp: new Date('2024-02-18') },
              { nodeType: 'AGREEMENT_SIGNED', operatorId: 'U001', operatorName: '李征收', timestamp: new Date('2024-02-20') },
              { nodeType: 'EVALUATION_CONFIRMED', operatorId: 'U002', operatorName: '王评估', timestamp: new Date('2024-02-22') },
              { nodeType: 'ACCEPTANCE_FAILED', operatorId: 'U003', operatorName: '张验收', timestamp: new Date('2024-02-25') }
            ]
          }
        }
      }
    }
  })

  await prisma.resident.create({
    data: {
      name: '孙七',
      idCardNumber: '110105199507052345',
      phone: '13500135005',
      address: '丰台区明珠小区6号楼101室',
      houses: {
        create: {
          houseNumber: '6-101',
          area: 70.0,
          buildingType: '住宅',
          location: '明珠小区',
          district: '丰台区'
        }
      },
      agreements: {
        create: {
          agreementNo: 'QY-2024-0005',
          houseId: '',
          signingDate: new Date('2024-03-01'),
          status: 'ACCEPTED',
          totalCompensation: 2100000,
          paymentStatus: 'UNPAID',
          handlerId: 'U001',
          handlerName: '李征收',
          evaluation: {
            create: {
              evaluatorId: 'U002',
              evaluatorName: '王评估',
              grossArea: 70.0,
              netArea: 64.2,
              unitPrice: 30000,
              totalAmount: 2100000,
              status: 'CONFIRMED',
              reviewed: true,
              reviewResult: '审核通过',
              reviewDate: new Date('2024-03-03')
            }
          },
          acceptance: {
            create: {
              inspectorId: 'U003',
              inspectorName: '张验收',
              checkDate: new Date('2024-03-05'),
              status: 'PASSED'
            }
          },
          compensation: {
            create: {
              reviewerId: 'U004',
              reviewerName: '赵财务',
              reviewDate: new Date('2024-03-08'),
              amount: 2100000,
              status: 'REVIEWED'
            }
          },
          historyNodes: {
            create: [
              { nodeType: 'AGREEMENT_REGISTERED', operatorId: 'U001', operatorName: '李征收', timestamp: new Date('2024-02-28') },
              { nodeType: 'AGREEMENT_SIGNED', operatorId: 'U001', operatorName: '李征收', timestamp: new Date('2024-03-01') },
              { nodeType: 'EVALUATION_CONFIRMED', operatorId: 'U002', operatorName: '王评估', timestamp: new Date('2024-03-03') },
              { nodeType: 'ACCEPTANCE_PASSED', operatorId: 'U003', operatorName: '张验收', timestamp: new Date('2024-03-05') },
              { nodeType: 'COMPENSATION_REVIEWED', operatorId: 'U004', operatorName: '赵财务', timestamp: new Date('2024-03-08') }
            ]
          }
        }
      }
    }
  })

  await prisma.resident.create({
    data: {
      name: '周八',
      idCardNumber: '110106198812156789',
      phone: '13800138006',
      address: '石景山万达广场7号楼501室',
      houses: {
        create: {
          houseNumber: '7-501',
          area: 110.0,
          buildingType: '商业',
          location: '万达广场',
          district: '石景山区'
        }
      },
      agreements: {
        create: {
          agreementNo: 'QY-2024-0006',
          houseId: '',
          signingDate: new Date('2024-03-10'),
          status: 'COMPENSATED',
          totalCompensation: 6600000,
          paymentStatus: 'PAID',
          handlerId: 'U001',
          handlerName: '李征收',
          evaluation: {
            create: {
              evaluatorId: 'U002',
              evaluatorName: '王评估',
              grossArea: 110.0,
              netArea: 102.0,
              unitPrice: 60000,
              totalAmount: 6600000,
              status: 'CONFIRMED',
              reviewed: true,
              reviewResult: '审核通过',
              reviewDate: new Date('2024-03-12')
            }
          },
          acceptance: {
            create: {
              inspectorId: 'U003',
              inspectorName: '张验收',
              checkDate: new Date('2024-03-15'),
              status: 'PASSED'
            }
          },
          compensation: {
            create: {
              reviewerId: 'U004',
              reviewerName: '赵财务',
              reviewDate: new Date('2024-03-18'),
              amount: 6600000,
              status: 'PAID',
              paymentDate: new Date('2024-03-20')
            }
          },
          historyNodes: {
            create: [
              { nodeType: 'AGREEMENT_REGISTERED', operatorId: 'U001', operatorName: '李征收', timestamp: new Date('2024-03-08') },
              { nodeType: 'AGREEMENT_SIGNED', operatorId: 'U001', operatorName: '李征收', timestamp: new Date('2024-03-10') },
              { nodeType: 'EVALUATION_CONFIRMED', operatorId: 'U002', operatorName: '王评估', timestamp: new Date('2024-03-12') },
              { nodeType: 'ACCEPTANCE_PASSED', operatorId: 'U003', operatorName: '张验收', timestamp: new Date('2024-03-15') },
              { nodeType: 'COMPENSATION_REVIEWED', operatorId: 'U004', operatorName: '赵财务', timestamp: new Date('2024-03-18') },
              { nodeType: 'COMPENSATION_APPROVED', operatorId: 'U004', operatorName: '赵财务', timestamp: new Date('2024-03-19') },
              { nodeType: 'COMPENSATION_PAID', operatorId: 'U004', operatorName: '赵财务', timestamp: new Date('2024-03-20') }
            ]
          }
        }
      }
    }
  })

  await prisma.resident.create({
    data: {
      name: '吴九',
      idCardNumber: '110107197604201234',
      phone: '13900139007',
      address: '通州区运河小区8号楼201室',
      houses: {
        create: {
          houseNumber: '8-201',
          area: 80.0,
          buildingType: '住宅',
          location: '运河小区',
          district: '通州区'
        }
      },
      agreements: {
        create: {
          agreementNo: 'QY-2024-0007',
          houseId: '',
          signingDate: new Date('2024-03-20'),
          status: 'SIGNED',
          totalCompensation: 0,
          paymentStatus: 'UNPAID',
          handlerId: 'U001',
          handlerName: '李征收',
          evaluation: {
            create: {
              evaluatorId: 'U002',
              evaluatorName: '王评估',
              grossArea: 80.0,
              netArea: 73.5,
              unitPrice: 28000,
              totalAmount: 2240000,
              status: 'PENDING'
            }
          },
          historyNodes: {
            create: [
              { nodeType: 'AGREEMENT_REGISTERED', operatorId: 'U001', operatorName: '李征收', timestamp: new Date('2024-03-18') },
              { nodeType: 'AGREEMENT_SIGNED', operatorId: 'U001', operatorName: '李征收', timestamp: new Date('2024-03-20') }
            ]
          }
        }
      }
    }
  })

  await prisma.resident.create({
    data: {
      name: '郑十',
      idCardNumber: '110108199209105678',
      phone: '13600136008',
      address: '顺义区空港家园9号楼302室',
      houses: {
        create: {
          houseNumber: '9-302',
          area: 90.0,
          buildingType: '住宅',
          location: '空港家园',
          district: '顺义区'
        }
      },
      agreements: {
        create: {
          agreementNo: 'QY-2024-0008',
          houseId: '',
          signingDate: new Date('2024-04-01'),
          status: 'DISPUTED',
          totalCompensation: 0,
          paymentStatus: 'FROZEN',
          frozen: true,
          freezeReason: '面积争议',
          handlerId: 'U001',
          handlerName: '李征收',
          evaluation: {
            create: {
              evaluatorId: 'U002',
              evaluatorName: '王评估',
              grossArea: 88.0,
              netArea: 81.2,
              unitPrice: 29000,
              totalAmount: 2552000,
              status: 'DISPUTED',
              disputeReason: '房产证面积为95平方米，实际测量存在差异'
            }
          },
          historyNodes: {
            create: [
              { nodeType: 'AGREEMENT_REGISTERED', operatorId: 'U001', operatorName: '李征收', timestamp: new Date('2024-03-28') },
              { nodeType: 'AGREEMENT_SIGNED', operatorId: 'U001', operatorName: '李征收', timestamp: new Date('2024-04-01') },
              { nodeType: 'EVALUATION_CONFIRMED', operatorId: 'U002', operatorName: '王评估', timestamp: new Date('2024-04-03') },
              { nodeType: 'AREA_DISPUTE', operatorId: 'U002', operatorName: '王评估', timestamp: new Date('2024-04-04') },
              { nodeType: 'FROZEN', operatorId: 'U001', operatorName: '李征收', timestamp: new Date('2024-04-04') },
              { nodeType: 'REVIEW_REQUESTED', operatorId: 'U001', operatorName: '李征收', timestamp: new Date('2024-04-05') }
            ]
          }
        }
      }
    }
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })