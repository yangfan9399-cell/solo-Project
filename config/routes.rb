Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  root "fault_records#index"

  resources :fault_records do
    collection do
      get :dashboard
    end
    member do
      get :review
      post :process_record
      post :accept
      post :assign_handler
      post :submit_review
      post :start_review
      post :review_pass
      post :return_supplement
      post :reopen
      post :upload_evidence
    end
  end

  post "switch_user", to: "application#switch_user"
end
