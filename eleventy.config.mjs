export default function (eleventyConfig) {
	eleventyConfig.setInputDirectory("www");

	eleventyConfig.addPassthroughCopy("www/styles");
	eleventyConfig.addPassthroughCopy("www/fonts");
	eleventyConfig.addPassthroughCopy("www/papers");
	eleventyConfig.addPassthroughCopy("www/assets");

	eleventyConfig.addFilter("readableDate", (dateObj) => {
		return new Intl.DateTimeFormat('en-US', {
		  year: 'numeric',
		  month: 'long',
		  day: 'numeric',
		  timeZone: 'UTC' // Prevents "off-by-one" day errors
		}).format(dateObj);
	  });
}