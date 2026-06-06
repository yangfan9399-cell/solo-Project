class CrewsController < ApplicationController
  before_action :set_crew, only: [:show, :edit, :update, :destroy]

  def index
    @crews = Crew.all.order(:name)
  end

  def show
    @borrow_records = @crew.borrow_records.order(created_at: :desc).includes(:prop)
    @active_borrows = @crew.borrow_records.active.includes(:prop)
  end

  def new
    @crew = Crew.new
    @users = User.all
  end

  def create
    @crew = Crew.new(crew_params)
    if @crew.save
      redirect_to @crew, notice: "剧组创建成功"
    else
      @users = User.all
      render :new
    end
  end

  def edit
    @users = User.all
  end

  def update
    if @crew.update(crew_params)
      redirect_to @crew, notice: "剧组更新成功"
    else
      @users = User.all
      render :edit
    end
  end

  def destroy
    @crew.destroy
    redirect_to crews_url, notice: "剧组已删除"
  end

  private

  def set_crew
    @crew = Crew.find(params[:id])
  end

  def crew_params
    params.require(:crew).permit(:name, :play_name, :description, :leader_id, :start_date, :end_date)
  end
end
