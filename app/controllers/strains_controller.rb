require "ostruct"

class StrainsController < ApplicationController
  def index
    @strains = GameSession::STRAINS.map do |id, info|
      OpenStruct.new(
        id: id,
        name: info[:name],
        color: info[:color],
        optimal_temp: info[:optimal_temp],
        temp_range: info[:temp_range],
        growth_rate: info[:growth_rate],
        ph_range: info[:ph_range]
      )
    end
    @contaminants = GameSession::CONTAMINANTS.map do |id, info|
      OpenStruct.new(
        id: id,
        name: info[:name],
        color: info[:color],
        optimal_temp: info[:optimal_temp],
        competitiveness: info[:competitiveness]
      )
    end
  end

  def show
    id = params[:id].to_i
    info = GameSession::STRAINS[id]
    if info
      @strain = OpenStruct.new(id: id, **info)
    else
      redirect_to strains_path, alert: "菌株不存在"
    end
  end
end
