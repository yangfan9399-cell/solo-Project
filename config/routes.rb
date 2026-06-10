Rails.application.routes.draw do
  get "statistics/index"
  resources :work_orders do
    member do
      post :submit_proof
      post :measure_color
      post :confirm
      post :reject
      post :start_production
      post :complete
    end
  end
  
  resources :customers
  
  get 'statistics', to: 'statistics#index'
  
  root 'work_orders#index'
end