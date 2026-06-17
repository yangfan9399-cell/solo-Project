require "test_helper"

class VersionsControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get versions_index_url
    assert_response :success
  end

  test "should get show" do
    get versions_show_url
    assert_response :success
  end

  test "should get export" do
    get versions_export_url
    assert_response :success
  end
end
