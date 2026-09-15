export default {
  async fetch(request) {
    return new Response("ARTISTIC API is running.", {
      headers: {
        "Content-Type": "text/plain; charset=UTF-8"
      }
    });
  }
};
