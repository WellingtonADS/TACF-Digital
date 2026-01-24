declare module "jspdf" {
  const jsPDF: any;
  export default jsPDF;
}

declare module "jspdf-autotable" {
  // side-effect augmenting jsPDF prototype
  const plugin: any;
  export default plugin;
}
