Rails.application.routes.draw do
  resources :regions
  resources :stores
  resources :material_categories
  resources :materials
  resources :batches
  resources :allocations
  resources :loss_reports
  resources :allocation_items
  resources :workflow_nodes

  get "dashboard", to: "dashboard#index"

  root "dashboard#index"
end
