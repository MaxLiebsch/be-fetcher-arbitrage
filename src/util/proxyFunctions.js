export async function changeRequestProxy(proxyType, link, cnt = 1) {
  const host = new URL(link).hostname;
  const response = await fetch(
    `http://127.0.0.1:8080/notify?proxy=${proxyType}&host=${host}&cnt=${cnt}`
  );
  if (response.status === 200) {
    return response;
  } else {
    throw new Error(`Failed to notify proxy. Status code: ${response.status}`);
  }
}

export async function terminateConnection(link) {
  const host = new URL(link).hostname;
  const response = await fetch(`http://127.0.0.1:8080/terminate?host=${host}`);
  if (response.status === 200) {
    return response;
  } else {
    throw new Error(`Failed to notify proxy. Status code: ${response.status}`);
  }
}
