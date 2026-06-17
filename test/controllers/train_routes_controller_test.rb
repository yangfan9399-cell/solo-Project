require "test_helper"

class TrainRoutesControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get train_routes_index_url
    assert_response :success
  end

  test "should get show" do
    get train_routes_show_url
    assert_response :success
  end

  test "should get new" do
    get train_routes_new_url
    assert_response :success
  end

  test "should get create" do
    get train_routes_create_url
    assert_response :success
  end

  test "should get edit" do
    get train_routes_edit_url
    assert_response :success
  end

  test "should get update" do
    get train_routes_update_url
    assert_response :success
  end

  test "should get destroy" do
    get train_routes_destroy_url
    assert_response :success
  end

  test "should get export" do
    get train_routes_export_url
    assert_response :success
  end
end
