require "test_helper"

class RubbingsControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get rubbings_index_url
    assert_response :success
  end

  test "should get show" do
    get rubbings_show_url
    assert_response :success
  end

  test "should get new" do
    get rubbings_new_url
    assert_response :success
  end

  test "should get create" do
    get rubbings_create_url
    assert_response :success
  end

  test "should get edit" do
    get rubbings_edit_url
    assert_response :success
  end

  test "should get update" do
    get rubbings_update_url
    assert_response :success
  end

  test "should get destroy" do
    get rubbings_destroy_url
    assert_response :success
  end

  test "should get search" do
    get rubbings_search_url
    assert_response :success
  end

  test "should get export" do
    get rubbings_export_url
    assert_response :success
  end
end
