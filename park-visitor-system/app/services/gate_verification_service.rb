class GateVerificationService
  def initialize(visit_record)
    @visit_record = visit_record
  end

  def verify(license_plate:, guard:)
    reservation = @visit_record.reservation
    vehicle = reservation.vehicle

    if vehicle.license_plate.upcase != license_plate.upcase
      @visit_record.add_history_node(
        action: '车牌核验失败',
        actor: guard,
        notes: "输入车牌: #{license_plate}, 预约车牌: #{vehicle.license_plate}"
      )
      return { success: false, message: '车牌不匹配' }
    end

    if Blacklist.is_blacklisted?(license_plate)
      @visit_record.block!(
        supervisor: guard,
        blocking_reason: "该车辆在黑名单中，禁止入园"
      )
      return { success: false, message: '该车辆在黑名单中，已自动拦截' }
    end

    if !reservation.can_be_verified?
      @visit_record.add_history_node(
        action: '预约状态无效',
        actor: guard,
        notes: "预约状态: #{reservation.status}"
      )
      return { success: false, message: '预约已过期或未确认' }
    end

    @visit_record.pending_approval!
    @visit_record.add_history_node(
      action: '车牌核验通过',
      actor: guard,
      notes: "车牌: #{license_plate}"
    )

    { success: true, message: '车牌核验通过，等待安保主管审批' }
  end
end
