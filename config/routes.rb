Rails.application.routes.draw do
  root 'projects#index'

  resources :projects do
    resources :run_charts, shallow: true do
      resources :train_routes, shallow: true do
        resources :stations, shallow: true
        resources :annotations, shallow: true
      end
      resources :annotations, shallow: true
      resources :versions, shallow: true do
        get :export_json
        get :export_summary
      end
      get :workbench
      get :detect_anomalies
      post :calibrate
    end
    resources :versions, shallow: true
  end

  get 'projects/:project_id/run_charts/:id/export_json', to: 'run_charts#export_json'
  get 'projects/:project_id/run_charts/:id/export_summary', to: 'run_charts#export_summary'

  get "up" => "rails/health#show", as: :rails_health_check
end
