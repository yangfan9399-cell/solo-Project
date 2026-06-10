class TracksController < ApplicationController
  before_action :require_login

  def index
    @tracks = Track.all.order(created_at: :desc)
    @tracks = @tracks.where("title LIKE ?", "%#{params[:q]}%") if params[:q].present?
    @tracks = @tracks.where(artist: params[:artist]) if params[:artist].present?
    @tracks = @tracks.where(copyright_holder: params[:holder]) if params[:holder].present?
  end

  def show
    @track = Track.find(params[:id])
    @authorization_scopes = @track.track_authorization_scopes
    @applications = @track.applications.order(created_at: :desc).limit(10)
  end

  def search
    @tracks = Track.where("title LIKE ? OR artist LIKE ?", "%#{params[:q]}%", "%#{params[:q]}%")
    render json: @tracks
  end
end