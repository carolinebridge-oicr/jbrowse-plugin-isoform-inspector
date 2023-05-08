describe('Test computational operations', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', (err, runnable) => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.visit('/?config=loaded.json')
    // open file screen successfully loads
    cy.contains('Opening file for: PSME4')

    // loads a file it selects
    cy.get('[data-testid=isoform-file-select]').selectFile(
      'cypress/fixtures/test_subj_observ.json',
      { force: true },
    )
    cy.get('#select-multiple-native').select(['test_subj_observ.json'])
    cy.contains('Submit').click()
    cy.contains('Splice junction read counts (raw)')
  })
  it('sorts by clustering and renders a dendrogram', () => {
    cy.get('[data-testid=view_menu_icon]').eq(1).click()
    cy.contains('Sort...').click()
    cy.contains('by clustering').click()
    cy.get('[data-testid=dendrogram]')
  })
  it('sorts by id', () => {
    cy.get('[data-testid=view_menu_icon]').eq(1).click()
    cy.contains('Sort...').click()
    cy.contains('by subject id').click()
    cy.get('[data-testid=dendrogram]').should('not.exist')
  })
})
