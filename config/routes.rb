Rails.application.routes.draw do
  resources :rubbings do
    collection do
      get :search
      get :export
      get :export_summary
    end
    member do
      get :versions
      get :warnings
    end
  end

  get "up" => "rails/health#show", as: :rails_health_check

  root "rubbings#index"
end
