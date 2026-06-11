class ReturnOrdersController < ApplicationController
  before_action :set_return_order, only: [
    :show,
    :approve_by_customer_service,
    :receive_by_warehouse,
    :review_by_operation,
    :resale,
    :report_loss,
    :raise_dispute
  ]

  def index
    page = [params[:page].to_i, 1].max
    per_page = 10
    @return_orders = ReturnOrder.includes(:order, :product, :anchor)
                                .then { |scope| filter_by_status(scope) }
                                .then { |scope| filter_by_anchor(scope) }
                                .then { |scope| filter_by_category(scope) }
                                .ordered
                                .offset((page - 1) * per_page)
                                .limit(per_page)
  end

  def show
    @inspection_record = @return_order.latest_inspection
    @status_histories = @return_order.status_histories.ordered
  end

  def new
    @return_order = ReturnOrder.new
    @orders = Order.without_return_order.ordered
  end

  def create
    @return_order = ReturnOrder.new(return_order_params)

    if @return_order.save
      redirect_to @return_order, notice: '退货单创建成功'
    else
      @orders = Order.without_return_order.ordered
      render :new, status: :unprocessable_entity
    end
  end

  def approve_by_customer_service
    @return_order.approve_by_customer_service!
    respond_to do |format|
      format.turbo_stream
      format.html { redirect_to @return_order }
    end
  end

  def receive_by_warehouse
    @return_order.receive_by_warehouse!
    respond_to do |format|
      format.turbo_stream
      format.html { redirect_to @return_order }
    end
  end

  def review_by_operation
    @return_order.review_by_operation!
    respond_to do |format|
      format.turbo_stream
      format.html { redirect_to @return_order }
    end
  end

  def resale
    begin
      @return_order.resale!
    rescue AASM::InvalidTransition
      flash[:alert] = '商品缺失时禁止二次上架'
    end
    respond_to do |format|
      format.turbo_stream
      format.html { redirect_to @return_order }
    end
  end

  def report_loss
    @return_order.report_loss!
    respond_to do |format|
      format.turbo_stream
      format.html { redirect_to @return_order }
    end
  end

  def raise_dispute
    @return_order.raise_dispute!
    respond_to do |format|
      format.turbo_stream
      format.html { redirect_to @return_order }
    end
  end

  private

  def set_return_order
    @return_order = ReturnOrder.find(params[:id])
  end

  def return_order_params
    params.require(:return_order).permit(:order_id, :reason, :customer_note, :refund_amount)
  end

  def filter_by_status(scope)
    return scope unless params[:status].present?
    scope.by_status(params[:status])
  end

  def filter_by_anchor(scope)
    return scope unless params[:anchor_id].present?
    scope.by_anchor(params[:anchor_id])
  end

  def filter_by_category(scope)
    return scope unless params[:category].present?
    scope.joins(:product).where(products: { category: params[:category] })
  end
end
