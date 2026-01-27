/**
 * Storyblok CDN API Client
 * 
 * Creates and returns a Storyblok client instance configured with
 * access token and space ID from environment variables.
 */

export function getStoryblokApi() {
  const StoryblokClient = require('storyblok-js-client')
  return new StoryblokClient({
    accessToken: process.env.NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN || '',
    space: process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID
  })
}
