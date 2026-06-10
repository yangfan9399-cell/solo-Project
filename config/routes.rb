Rails.application.routes.draw do
  resources :interviews do
    member do
      post :submit_for_review
      post :brand_review
      post :legal_review
      post :publish_review
      post :publish
      post :reject
      post :add_sensitive_item
      post :cover_sensitive_item
      post :upload_authorization
    end
    collection do
      get :statistics
    end
  end

  get "up" => "rails/health#show", as: :rails_health_check

  root "interviews#index"
end