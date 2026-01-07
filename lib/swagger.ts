import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "AutoBeli API Documentation",
        version: "1.0",
        description: "API documentation for AutoBeli application",
      },
      tags: [
        { name: "Products", description: "Product management endpoints" },
        { name: "Orders", description: "Order processing endpoints" },
        { name: "Auth", description: "Authentication endpoints" },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [],
    },
  });
  return spec;
};
