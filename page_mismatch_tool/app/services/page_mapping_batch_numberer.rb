class PageMappingBatchNumberer
  DEFAULT_OPTIONS = {
    start_number: 1,
    prefix: "",
    suffix: "",
    increment: 1
  }.freeze

  def initialize(project, options = {})
    @project = project
    options = options.transform_keys(&:to_sym)
    @options = DEFAULT_OPTIONS.merge(options)
    @options[:start_number] = @options[:start_number].to_i if @options[:start_number].is_a?(String)
    @options[:increment] = @options[:increment].to_i if @options[:increment].is_a?(String)
    @options[:start_number] = 1 if @options[:start_number].to_i <= 0
    @options[:increment] = 1 if @options[:increment].to_i <= 0
  end

  def number!
    count = 0
    current_number = @options[:start_number]
    prefix = @options[:prefix].to_s
    suffix = @options[:suffix].to_s
    increment = @options[:increment]

    mappings = @project.page_mappings.order(:pdf_page_index)

    ActiveRecord::Base.transaction do
      mappings.each do |mapping|
        label = build_label(current_number, prefix, suffix)
        new_status = mapping.status == PageMapping::INSERTED ? PageMapping::INSERTED : PageMapping::NORMAL

        mapping.update!(
          actual_page_number: current_number,
          status: new_status,
          notes: prefix.present? || suffix.present? ? label : mapping.notes
        )

        current_number += increment
        count += 1
      end
    end

    count
  end

  private

  def build_label(number, prefix, suffix)
    "#{prefix}#{number}#{suffix}"
  end
end
