export default function (eleventyConfig) {
	eleventyConfig.setInputDirectory("www");

	eleventyConfig.addPassthroughCopy("www/styles");
	eleventyConfig.addPassthroughCopy("www/fonts");
}