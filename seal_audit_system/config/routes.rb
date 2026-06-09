Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  root "dashboard#index"

  get "dashboard", to: "dashboard#index"
  get "dashboard/review", to: "dashboard#review"

  resources :seal_applications do
    member do
      post :submit
      post :legal_approve
      post :legal_reject
      post :resolve_version
      post :seal_approve
      post :seal_reject
      post :mark_absent
      post :resume_absence
      post :archive_approve
      post :fix_archive
    end
  end

  resources :contracts
  resources :seals
  resources :departments
  resources :users
end
