require "test_helper"

class UsageScenariosControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get usage_scenarios_index_url
    assert_response :success
  end

  test "should get show" do
    get usage_scenarios_show_url
    assert_response :success
  end

  test "should get new" do
    get usage_scenarios_new_url
    assert_response :success
  end

  test "should get create" do
    get usage_scenarios_create_url
    assert_response :success
  end

  test "should get edit" do
    get usage_scenarios_edit_url
    assert_response :success
  end

  test "should get update" do
    get usage_scenarios_update_url
    assert_response :success
  end

  test "should get destroy" do
    get usage_scenarios_destroy_url
    assert_response :success
  end

  test "should get review" do
    get usage_scenarios_review_url
    assert_response :success
  end

  test "should get legal_review" do
    get usage_scenarios_legal_review_url
    assert_response :success
  end

  test "should get operations_confirm" do
    get usage_scenarios_operations_confirm_url
    assert_response :success
  end

  test "should get remove" do
    get usage_scenarios_remove_url
    assert_response :success
  end
end
