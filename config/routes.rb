Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  root "dashboard#index"

  resources :props do
    member do
      get "borrow_history"
      get "inspection_history"
      get "compensation_history"
    end
    collection do
      get "categories"
      get "check_conflict"
      get "available_slots"
    end
  end

  resources :crews

  resources :borrow_records do
    member do
      patch "confirm"
      patch "checkout"
      patch "return"
      patch "audit_return"
      patch "start_compensation"
      patch "start_repair"
      patch "cancel"
      get "conflicts"
    end
    collection do
      get "active"
      get "overdue"
    end
  end

  resources :inspection_records, only: [:index, :show]
  resources :compensations do
    member do
      patch "dispute"
      patch "resolve"
      patch "pay"
    end
  end
  resources :repair_records do
    member do
      patch "complete"
    end
  end

  resources :users

  get "statistics", to: "statistics#index", as: :statistics
  get "statistics/by_category", to: "statistics#by_category", as: :by_category_statistics
  get "statistics/by_crew", to: "statistics#by_crew", as: :by_crew_statistics
  get "statistics/by_damage_type", to: "statistics#by_damage_type", as: :by_damage_type_statistics
  get "statistics/compensation_amount", to: "statistics#compensation_amount", as: :compensation_amount_statistics
end
