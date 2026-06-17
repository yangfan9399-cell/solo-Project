require "test_helper"

class RunChartsControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get run_charts_index_url
    assert_response :success
  end

  test "should get show" do
    get run_charts_show_url
    assert_response :success
  end

  test "should get new" do
    get run_charts_new_url
    assert_response :success
  end

  test "should get create" do
    get run_charts_create_url
    assert_response :success
  end

  test "should get edit" do
    get run_charts_edit_url
    assert_response :success
  end

  test "should get update" do
    get run_charts_update_url
    assert_response :success
  end

  test "should get destroy" do
    get run_charts_destroy_url
    assert_response :success
  end
end
