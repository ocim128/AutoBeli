"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spec: any;
};

function ReactSwagger({ spec }: Props) {
  return (
    <div className="swagger-tactical">
      <SwaggerUI spec={spec} />
    </div>
  );
}

export default ReactSwagger;
