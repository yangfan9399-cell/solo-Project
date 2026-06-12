class SimplePaginator
  attr_reader :page, :per_page, :count, :pages, :records, :from, :to, :prev, :next

  def initialize(scope, current_page, per_page)
    @page = current_page.to_i
    @page = 1 if @page < 1
    @per_page = per_page.to_i
    @count = scope.count
    @pages = (@count.to_f / @per_page).ceil
    @pages = 1 if @pages < 1

    offset = (@page - 1) * @per_page
    @records = scope.offset(offset).limit(@per_page)
    @from = @count > 0 ? offset + 1 : 0
    @to = [offset + @per_page, @count].min
    @prev = @page > 1 ? @page - 1 : nil
    @next = @page < @pages ? @page + 1 : nil
  end

  def series
    return [] if @pages <= 1

    series = []
    left = 1
    right = @pages
    window = 2
    left_window = @page - window
    right_window = @page + window

    (left..right).each do |i|
      if i == left || i == right || (i >= left_window && i <= right_window)
        series << i
      elsif series.last != :gap
        series << :gap
      end
    end

    series
  end
end
