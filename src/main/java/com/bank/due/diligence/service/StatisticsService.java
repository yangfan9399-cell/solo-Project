package com.bank.due.diligence.service;

import java.util.List;
import java.util.Map;

public interface StatisticsService {

    List<Map<String, Object>> getBranchStatistics();

    List<Map<String, Object>> getIndustryStatistics();

    List<Map<String, Object>> getStatusStatistics();

    List<Map<String, Object>> getReturnReasonStatistics();

    Map<String, Object> getAccountOpeningCycle();

    Map<String, Object> getDashboardSummary();
}
