Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  resources :course_packages, only: %i[index show] do
    member do
      post :consume
      post :exchange
      post :transfer
      post :request_refund
      post :approve
      post :reject
      post :archive
      post :reopen
    end
  end

  post 'users/switch/:id', to: 'users#switch', as: :switch_user

  root 'course_packages#index'
end
