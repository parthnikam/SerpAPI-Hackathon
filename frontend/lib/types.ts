export type SearchPayload = {
  engine: string;
  components: string[];
  params: Record<string, unknown>;
  results: Record<string, unknown>;
};
