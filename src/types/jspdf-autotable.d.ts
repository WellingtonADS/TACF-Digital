declare module "jspdf" {
  const jsPDF: unknown;
  export default jsPDF;
}

declare module "jspdf-autotable" {
  // side-effect augmenting jsPDF prototype
  const plugin: unknown;
  export default plugin;
}
