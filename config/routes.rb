Rails.application.routes.draw do
  root 'projects#index'

  resources :projects do
    resources :run_charts do
      resources :train_routes do
        resources :stations
        resources :annotations
      end
      resources :annotations
      resources :versions do
        get :export_json
        get :export_summary
      end
      get :workbench
      get :detect_anomalies
      post :calibrate
      get :export_json
      get :export_summary
    end
    resources :versions
  end

  get "up" => "rails/health#show", as: :rails_health_check
end
