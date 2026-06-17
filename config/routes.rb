Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  root "projects#index"

  resources :projects do
    collection do
      get :export
      get :search
    end

    member do
      get :export_components
    end

    resources :components do
      collection do
        get :export
      end

      resources :defects
      resources :component_versions do
        member do
          get :diff
        end
      end
      resources :reassembly_records

      member do
        post :reassembly_check
        post :rollback
      end
    end
  end
end
