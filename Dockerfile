FROM ruby:3.3-slim

RUN apt-get update -qq && apt-get install -y nodejs postgresql-client build-essential

WORKDIR /app

COPY Gemfile Gemfile.lock ./
RUN bundle install

COPY . .

RUN bin/rails assets:precompile || true

EXPOSE 3000

CMD ["bin/rails", "server", "-b", "0.0.0.0"]