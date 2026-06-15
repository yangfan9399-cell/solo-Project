Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  root "home#index"

  resources :game_sessions, except: [:edit, :update, :destroy] do
    member do
      post :adjust_temperature
      post :add_nutrient
      post :adjust_moisture
      post :adjust_ph
      post :place_antibiotic
      post :simulate_growth
      post :simulate_contamination
      post :finalize
      post :rollback
      post :recalculate
      get :colony_map
      get :contamination_diff
      get :batch_comparison
    end
    collection do
      get :index
      get :batch_comparison_list
    end
  end

  resources :strains, only: [:index, :show]
  resources :experiments, only: [:index, :show]
end
