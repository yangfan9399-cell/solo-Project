class PatientsController < ApplicationController
  before_action :authenticate_user!, except: [:index, :show]

  def index
    @patients = Patient.order(created_at: :desc)
    @patients = @patients.search(params[:q]) if params[:q].present?
  end

  def show
    @patient = Patient.includes(exams: :report).find(params[:id])
  end

  def new
    @patient = Patient.new
  end

  def create
    @patient = Patient.new(patient_params)
    if @patient.save
      redirect_to @patient, notice: "患者信息已创建"
    else
      render :new
    end
  end

  private

  def patient_params
    params.require(:patient).permit(:name, :id_card, :phone, :birth_date, :gender, :address)
  end
end