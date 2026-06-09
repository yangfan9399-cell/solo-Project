package com.bank.due.diligence.form;

import com.bank.due.diligence.entity.BeneficialOwner;
import com.bank.due.diligence.entity.BusinessAddress;
import com.bank.due.diligence.entity.Enterprise;
import com.bank.due.diligence.entity.LegalPerson;
import lombok.Data;

@Data
public class ApplicationForm {

    private Enterprise enterprise = new Enterprise();

    private LegalPerson legalPerson = new LegalPerson();

    private BeneficialOwner beneficialOwner = new BeneficialOwner();

    private BusinessAddress address = new BusinessAddress();

    private String accountType;

    private Long branchId;
}
