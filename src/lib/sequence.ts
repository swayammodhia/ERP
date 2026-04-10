export async function nextSequence(client: unknown, name: string) {
  const counter = await (
    client as {
      counter: {
        upsert: (args: {
          where: { name: string };
          update: { value: { increment: number } };
          create: { name: string; value: number };
        }) => Promise<{ value: number }>;
      };
    }
  ).counter.upsert({
    where: { name },
    update: {
      value: {
        increment: 1,
      },
    },
    create: {
      name,
      value: 1,
    },
  });

  return counter.value;
}
