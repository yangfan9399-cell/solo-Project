Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  root "dashboard#index"

  resources :vehicles do
    member do
      patch :start_maintenance
      patch :complete_maintenance
      patch :start_repair
      patch :complete_repair
      patch :approve_trip
      patch :reject_trip
      patch :decommission
    end
  end

  resources :maintenance_plans, except: [:destroy]
  resources :repair_records, except: [:destroy] do
    member do
      patch :complete
    end
  end
  resources :inspection_records, except: [:destroy]

  resources :trip_records, except: [:destroy] do
    member do
      patch :approve
      patch :reject
      patch :complete
    end
  end

  resources :fuel_records, except: [:destroy]

  get "analytics", to: "analytics#index"
  get "analytics/by_fleet", to: "analytics#by_fleet", as: :by_fleet_analytics
  get "analytics/by_model", to: "analytics#by_model", as: :by_model_analytics
  get "analytics/by_reason", to: "analytics#by_reason", as: :by_reason_analytics
  get "analytics/decommission", to: "analytics#decommission", as: :decommission_analytics
end
