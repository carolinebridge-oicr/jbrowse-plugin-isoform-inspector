describe('Test Isoform Inspector options', () => {
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
    cy.get('[data-testid=view_menu_icon]').eq(1).click()
    cy.contains('Annotations...').click()
  })
  it('turns an annotation off', () => {
    cy.get('[data-testid=annotation-checkbox]').eq(0).click()
    cy.contains('Heatmap annotations options').children().eq(0).click()
    cy.contains('Specimen Type').should('not.exist')
  })
  it('turns all annotations off', () => {
    cy.get('[data-testid=annotation-checkbox]').eq(0).click()
    cy.get('[data-testid=annotation-checkbox]').eq(0).click()
    cy.get('[data-testid=annotation-checkbox]').eq(0).click()
    cy.contains('Heatmap annotations options').children().eq(0).click()
    cy.contains('Specimen Type').should('not.exist')
    cy.contains('Project').should('not.exist')
    cy.contains('Study').should('not.exist')
  })
})
