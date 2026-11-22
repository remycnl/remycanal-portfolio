/** The error thrown by a content page whose entry does not exist. */
export const notFound = () =>
	createError({ statusCode: 404, statusMessage: "Not found", fatal: true })
