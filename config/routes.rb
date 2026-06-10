Rails.application.routes.draw do
  resources :regions
  resources :stores
  resources :material_categories
  resources :materials
  resources :batches

  resources :allocations do
    member do
      post :approve
      post :mark_in_transit
      post :receive
      post :reject
    end
    resources :items, controller: "allocation_items", only: [:new, :create]
  end

  resources :loss_reports do
    member do
      post :approve
      post :reject_approval
    end
  end

  resources :workflow_nodes

  get "dashboard", to: "dashboard#index"

  root "dashboard#index"
end