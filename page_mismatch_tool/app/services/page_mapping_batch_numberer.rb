class PageMappingBatchNumberer
  DEFAULT_OPTIONS = {
    start_number: 1,
    prefix: "",
    suffix: "",
    increment: 1
  }.freeze

  def initialize(project, options = {})
    @project = project
    @options = DEFAULT_OPTIONS.merge(options)
  end

  def number!
    count = 0
    current_number = @options[:start_number]
    prefix = @options[:prefix]
    suffix = @options[:suffix]
    increment = @options[:increment]

    mappings = @project.page_mappings.order(:pdf_page_index)

    mappings.each do |mapping|
      label = build_label(current_number, prefix, suffix)

      if mapping.status == PageMapping::INSERTED
        mapping.update!(actual_page_number: current_number, notes: label)
        mapping.update!(status: PageMapping::INSERTED)
      else
        mapping.update!(actual_page_number: current_number, notes: label)
      end

      current_number += increment
      count += 1
    end

    count
  end

  private

  def build_label(number, prefix, suffix)
    "#{prefix}#{number}#{suffix}"
  end
end
